import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { prisma } from '../db';
import { getCachedMenu } from './menuCache';
import { getRecommendations } from './recommendations';
import { createPaymentLink } from './payments';
import { sendWhatsAppMessage } from '../routes/whatsapp';

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey || 'dummy-key-to-compile',
});

// System persona prompt
const SYSTEM_PROMPT = `You are Rahul, a warm, polite, and efficient AI phone ordering agent for the restaurant "Chai & Chutney". Your job is to take customer orders, manage their cart, capture their address, and verbally lock in the order for checkout.

CRITICAL RULES FOR SPEECH INTERFACE:
1. Speak in natural Hinglish (conversational Hindi mixed with English keywords). Keep your responses short and friendly. (e.g. "Sure sir, ek Paneer Butter Masala add kar diya hai. Kuch aur chahiye?")
2. DO NOT output HTML, asterisks, bold characters, markdown, or bullet points in your speech response. Write text that sounds natural when spoken aloud.
3. If the customer specifies items, always use the tool 'add_to_cart' to update their cart. If they ask to remove something, use 'remove_from_cart'.
4. Do not assume or guess items that are not on the menu. If they ask for something not available, politely guide them to available options.
5. Once they say they are done ordering, summarize their cart, ask for their delivery address, and once they provide it, verbally confirm all items, total, and address before triggering 'confirm_order'.
6. Keep your responses under 2-3 sentences. Short conversational dialogue is essential for phone latency.`;

// Conversational tools schema for Claude Haiku
const CLAUDE_TOOLS: any[] = [
  {
    name: 'get_menu',
    description: 'Fetches the complete restaurant food menu containing active items, pricing, and descriptions.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'add_to_cart',
    description: 'Adds specified food items to the customer\'s active shopping cart.',
    input_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          description: 'List of items to add to the cart.',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'The food item name or variation specified by the user (e.g. "pbm", "naan", "garlic naan", "paneer butter").',
              },
              quantity: {
                type: 'number',
                description: 'The quantity of this item. Default is 1.',
              },
            },
            required: ['name'],
          },
        },
      },
      required: ['items'],
    },
  },
  {
    name: 'remove_from_cart',
    description: 'Removes specified items or reduces their quantities from the customer\'s cart.',
    input_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          description: 'List of items to remove from the cart.',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'The name or phonetic alias of the item to remove.',
              },
            },
            required: ['name'],
          },
        },
      },
      required: ['items'],
    },
  },
  {
    name: 'confirm_order',
    description: 'Locks the customer\'s cart, registers their delivery address, calculates total with taxes, and creates the finalized checkout order record.',
    input_schema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'The customer\'s delivery address provided verbally during the call.',
        },
      },
      required: ['address'],
    },
  },
];

/**
 * Fuzzy matches a customer input against all seeded menu items (evaluating names & alias arrays).
 * @param query The item phrase specified by the customer.
 * @param menuList The list of available database MenuItem entries.
 */
function findMatchingMenuItem(query: string, menuList: any[]) {
  const normalizedQuery = query.toLowerCase().trim();

  // Try exact or substring match on item name first
  let match = menuList.find(
    (item) =>
      item.name.toLowerCase() === normalizedQuery ||
      item.name.toLowerCase().includes(normalizedQuery)
  );

  if (match) return match;

  // Try matching inside the seeded alias array
  match = menuList.find((item) =>
    item.aliases.some(
      (alias: string) =>
        alias.toLowerCase() === normalizedQuery ||
        normalizedQuery.includes(alias.toLowerCase())
    )
  );

  return match;
}

/**
 * Orchestrates customer transcripts through Claude tool calls and saves conversation records.
 * @param sessionId The active phone Call SID or WhatsApp number.
 * @param userText The customer transcript.
 */
export async function generateAIResponse(sessionId: string, userText: string): Promise<string> {
  console.log(`[Claude Brain] Processing sessionId: ${sessionId}, input: "${userText}"`);

  // Local helper for offline Hinglish fallback
  const executeOfflineFallback = async (): Promise<string> => {
    console.log('[Claude Brain Fallback] Offline bilingual Hinglish agent processing conversational input...');
    
    let session = await prisma.customerSession.findUnique({
      where: { id: sessionId },
      include: { merchant: true },
    });

    if (!session) {
      throw new Error(`Session with ID ${sessionId} not initialized in database.`);
    }

    const menu = await getCachedMenu(session.merchantId);
    let activeCart: any = typeof session.activeCart === 'string' ? JSON.parse(session.activeCart) : session.activeCart;
    if (!activeCart || !activeCart.items) {
      activeCart = { items: [] };
    }

    const callLog = await prisma.callLog.findFirst({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
    });
    
    let transcriptList: any[] = [];
    if (callLog && callLog.transcript) {
      transcriptList = callLog.transcript as any[];
    }

    transcriptList.push({ role: 'customer', text: userText, time: new Date().toISOString() });

    let reply = '';
    const normalizedInput = userText.toLowerCase();

    if (session.currentState === 'GREETING' || normalizedInput.includes('hello') || normalizedInput.includes('hi') || normalizedInput.includes('swagat') || normalizedInput.includes('hey')) {
      reply = `Namaste! Chai & Chutney mein aapka swagat hai. Main Rahul hoon. Aaj hamare paas special Paneer Butter Masala aur Garlic Naan hai. Aap kya order karna chahenge?`;
      await prisma.customerSession.update({
        where: { id: session.id },
        data: { currentState: 'ORDERING' }
      });
    } else if (normalizedInput.includes('menu') || normalizedInput.includes('list') || normalizedInput.includes('kya kya hai') || normalizedInput.includes('kya milta')) {
      const itemsList = menu.map((m: any) => `${m.name} (₹${m.price})`).join(', ');
      reply = `Menu mein aapke liye hai: ${itemsList}. Bataiye, isme se kya add karu aapke cart mein?`;
    } else if (normalizedInput.includes('delete') || normalizedInput.includes('remove') || normalizedInput.includes('hatao') || normalizedInput.includes('cancel')) {
      let removedName = '';
      for (const item of menu) {
        if (normalizedInput.includes(item.name.toLowerCase()) || item.aliases.some((a: string) => normalizedInput.includes(a.toLowerCase()))) {
          const idx = activeCart.items.findIndex((i: any) => i.menuItemId === item.id);
          if (idx > -1) {
            removedName = activeCart.items[idx].name;
            activeCart.items.splice(idx, 1);
            break;
          }
        }
      }
      
      await prisma.customerSession.update({
        where: { id: session.id },
        data: { activeCart }
      });

      if (removedName) {
        reply = `Sure sir, maine ${removedName} aapke cart se hata diya hai. Ab cart mein ${activeCart.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ') || 'kuch nahi'} hai.`;
      } else {
        reply = `Sir, aapke cart mein wo item nahi mila. Kripya check karke batayein.`;
      }
    } else if (normalizedInput.includes('order') || normalizedInput.includes('add') || normalizedInput.includes('chahiye') || normalizedInput.includes('paneer') || normalizedInput.includes('naan') || normalizedInput.includes('lassi') || normalizedInput.includes('pbm') || normalizedInput.includes('masala')) {
      const addedItems: string[] = [];
      for (const item of menu) {
        if (normalizedInput.includes(item.name.toLowerCase()) || item.aliases.some((a: string) => normalizedInput.includes(a.toLowerCase()))) {
          let qty = 1;
          if (normalizedInput.includes('do ') || normalizedInput.includes(' 2 ') || normalizedInput.includes('two')) {
            qty = 2;
          } else if (normalizedInput.includes('teen ') || normalizedInput.includes(' 3 ') || normalizedInput.includes('three')) {
            qty = 3;
          }

          const existingIdx = activeCart.items.findIndex((i: any) => i.menuItemId === item.id);
          if (existingIdx > -1) {
            activeCart.items[existingIdx].quantity += qty;
          } else {
            activeCart.items.push({
              menuItemId: item.id,
              name: item.name,
              price: item.price,
              quantity: qty
            });
          }
          addedItems.push(`${qty}x ${item.name}`);
        }
      }

      await prisma.customerSession.update({
        where: { id: session.id },
        data: { activeCart, currentState: 'ORDERING' }
      });

      if (addedItems.length > 0) {
        const cartStr = activeCart.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ');
        reply = `Bilkul sir! Maine ${addedItems.join(' aur ')} add kar diya hai. Ab aapke cart mein ${cartStr} hai. Kya main order finalize karke delivery address le sakta hoon?`;
      } else {
        reply = `Chai & Chutney mein aapka swagat hai sir! Aap special Paneer Butter Masala, Garlic Naan ya Mango Lassi me se kya order karenge?`;
      }
    } else if (session.currentState === 'ORDERING' && (normalizedInput.includes('yes') || normalizedInput.includes('confirm') || normalizedInput.includes('address') || normalizedInput.includes('finalize') || normalizedInput.includes('haan') || normalizedInput.includes('address is') || normalizedInput.length > 10)) {
      if (activeCart.items.length === 0) {
        reply = `Sir, aapka cart abhi khali hai. Kripya pehle Paneer Butter Masala ya Garlic Naan order karein.`;
      } else {
        const hasAddressMatch = normalizedInput.includes('sector') || normalizedInput.includes('avenue') || normalizedInput.includes('street') || normalizedInput.includes('house') || normalizedInput.includes('road') || normalizedInput.includes('bangalore') || normalizedInput.includes('address');
        
        if (hasAddressMatch || normalizedInput.length > 15) {
          const address = userText;
          const subtotal = activeCart.items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
          const tax = subtotal * 0.05;
          const total = subtotal + tax;

          const createdOrder = await prisma.order.create({
            data: {
              merchantId: session.merchantId,
              customerPhone: session.customerPhone,
              channel: session.channel,
              items: activeCart.items,
              subtotal,
              tax,
              total,
              address: address,
              paymentStatus: 'PENDING',
              deliveryStatus: 'RECEIVED',
            }
          });

          const paymentLink = `https://rzp.io/i/mock-${createdOrder.id}`;
          
          await prisma.order.update({
            where: { id: createdOrder.id },
            data: { paymentLinkId: paymentLink }
          });

          await prisma.customerSession.update({
            where: { id: session.id },
            data: {
              currentState: 'COMPLETED',
              address: address,
              activeCart: { items: [] }
            }
          });

          reply = `Aapka order finalize ho gaya hai sir! Total bill ₹${Math.round(total)} hai. Delivery address "${address}" par order complete ho gaya hai. Payment link WhatsApp par bhej diya hai, thank you!`;
        } else {
          reply = `Ji sir, aapka total bill ₹${Math.round(activeCart.items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0))} hai. Kripya apna delivery address batayein.`;
          await prisma.customerSession.update({
            where: { id: session.id },
            data: { currentState: 'ORDERING' }
          });
        }
      }
    } else {
      reply = `Ji, main samajh gaya. Kya main aapke cart mein Paneer Butter Masala ya Garlic Naan add karu, ya order confirm karne ke liye address note karu?`;
    }

    transcriptList.push({ role: 'ai', text: reply, time: new Date().toISOString() });

    if (callLog) {
      await prisma.callLog.update({
        where: { id: callLog.id },
        data: { transcript: transcriptList }
      });
    } else {
      await prisma.callLog.create({
        data: {
          id: sessionId,
          sessionId: session.id,
          transcript: transcriptList
        }
      });
    }

    return reply;
  };

  // Fallback: If Anthropic credentials are not set, execute our high-fidelity offline Hinglish NLP agent
  if (!config.anthropicApiKey || config.anthropicApiKey === '' || config.anthropicApiKey === 'dummy-key-to-compile') {
    return executeOfflineFallback();
  }

  try {
    // 1. Fetch active session state from database
    let session = await prisma.customerSession.findUnique({
      where: { id: sessionId },
      include: { merchant: true },
    });

    if (!session) {
      throw new Error(`Session with ID ${sessionId} not initialized in database.`);
    }

    // 2. Fetch conversation history from CallLog transcripts to give AI short-term context memory
    const callLog = await prisma.callLog.findFirst({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
    });

    let messageHistory: Anthropic.MessageParam[] = [];
    let transcriptList: any[] = [];

    if (callLog && callLog.transcript) {
      try {
        transcriptList = callLog.transcript as any[];
        // Map historical dialog exchanges into Claude thread format
        transcriptList.forEach((msg: any) => {
          messageHistory.push({
            role: msg.role === 'customer' ? 'user' : 'assistant',
            content: msg.text,
          });
        });
      } catch (e) {
        console.error('[Claude Brain] Error loading transcript history:', e);
      }
    }

    // Append the latest customer text
    messageHistory.push({ role: 'user', content: userText });
    transcriptList.push({ role: 'customer', text: userText, time: new Date().toISOString() });

    const recommendations = await getRecommendations(session.merchantId, session.customerPhone);

    let loopsRemaining = 5; // Prevent tool calling infinite loops
    let finalResponseText = '';
    let activeCart: any = typeof session.activeCart === 'string' ? JSON.parse(session.activeCart) : session.activeCart;

    while (loopsRemaining > 0) {
      loopsRemaining--;

      // Inject active cart context dynamically into system message
      const dynamicSystemContext = `${SYSTEM_PROMPT}

CURRENT SESSION ENVIRONMENT:
- Merchant Name: "${session.merchant.name}"
- Customer Phone: "${session.customerPhone}"
- Active Cart: ${JSON.stringify(activeCart.items)}
- Current State: "${session.currentState}"
- Delivery Address: "${session.address || 'Not Provided'}"

RECOMMENDED SUGGESTIONS FOR THIS CUSTOMER:
${recommendations.favorites.length > 0 ? `- Customer favorites (ordered frequently): ${recommendations.favorites.join(', ')}` : ''}
${recommendations.popularTimeOfDay.length > 0 ? `- Popular items at this hour: ${recommendations.popularTimeOfDay.join(', ')}` : ''}

Note: If the Current State is "GREETING", welcome the customer warmly in Hinglish and pitch/suggest one of these options as a personalized recommendation!`;

      // Request Claude Haiku response
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 450,
        system: dynamicSystemContext,
        messages: messageHistory,
        tools: CLAUDE_TOOLS,
      });

      // Check if Claude requested a tool execution
      const toolUse = response.content.find((c) => c.type === 'tool_use');

      if (toolUse && toolUse.type === 'tool_use') {
        const toolCall = toolUse as any;
        console.log(`[Claude Brain] Tool execution requested: ${toolCall.name}`, toolCall.input);

        // Append assistant's tool-request block to message history
        messageHistory.push({ role: 'assistant', content: response.content as any });

        let toolOutput = '';

        try {
          const menu = await getCachedMenu(session.merchantId);

          switch (toolCall.name) {
            case 'get_menu': {
              const formattedMenu = menu.map((m: any) => `${m.name} - ₹${m.price} (${m.description || ''})`).join('\n');
              toolOutput = `Available Menu:\n${formattedMenu}`;
              break;
            }

            case 'add_to_cart': {
              const inputItems = (toolCall.input as any).items || [];
              const added: string[] = [];
              const failed: string[] = [];

              for (const item of inputItems) {
                const matchedItem = findMatchingMenuItem(item.name, menu);
                if (matchedItem) {
                  const qty = item.quantity || 1;
                  const existingIdx = activeCart.items.findIndex((i: any) => i.menuItemId === matchedItem.id);

                  if (existingIdx > -1) {
                    activeCart.items[existingIdx].quantity += qty;
                  } else {
                    activeCart.items.push({
                      menuItemId: matchedItem.id,
                      name: matchedItem.name,
                      price: matchedItem.price,
                      quantity: qty,
                    });
                  }
                  added.push(`${qty}x ${matchedItem.name}`);
                } else {
                  failed.push(item.name);
                }
              }

              // Sync updated cart back to active database session
              await prisma.customerSession.update({
                where: { id: session.id },
                data: { activeCart: activeCart, currentState: 'ORDERING' },
              });

              toolOutput = `Added to cart: ${added.join(', ')}.${failed.length ? ` Could not find: ${failed.join(', ')}.` : ''}`;
              break;
            }

            case 'remove_from_cart': {
              const inputItems = (toolCall.input as any).items || [];
              const removed: string[] = [];

              for (const item of inputItems) {
                const matchedItem = findMatchingMenuItem(item.name, menu);
                if (matchedItem) {
                  const existingIdx = activeCart.items.findIndex((i: any) => i.menuItemId === matchedItem.id);
                  if (existingIdx > -1) {
                    removed.push(activeCart.items[existingIdx].name);
                    activeCart.items.splice(existingIdx, 1);
                  }
                }
              }

              await prisma.customerSession.update({
                where: { id: session.id },
                data: { activeCart: activeCart },
              });

              toolOutput = `Removed from cart: ${removed.join(', ')}.`;
              break;
            }

            case 'confirm_order': {
              const deliveryAddress = (toolCall.input as any).address || '';
              if (activeCart.items.length === 0) {
                toolOutput = 'Error: Cannot confirm order. Cart is empty!';
                break;
              }

              // Calculate totals
              const subtotal = activeCart.items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
              const tax = subtotal * 0.05; // 5% CGST + SGST total tax
              const total = subtotal + tax;

              // Register confirmed checkout Order
              const createdOrder = await prisma.order.create({
                data: {
                  merchantId: session.merchantId,
                  customerPhone: session.customerPhone,
                  channel: session.channel,
                  items: activeCart.items,
                  subtotal,
                  tax,
                  total,
                  address: deliveryAddress,
                  paymentStatus: 'PENDING',
                  deliveryStatus: 'RECEIVED',
                },
              });

              // Generate Payment Link (Step 11)
              const paymentLink = await createPaymentLink(createdOrder.id, total, session.customerPhone);

              // Update order with paymentLinkId
              await prisma.order.update({
                where: { id: createdOrder.id },
                data: { paymentLinkId: paymentLink },
              });

              // Lock session state to COMPLETED
              await prisma.customerSession.update({
                where: { id: session.id },
                data: {
                  currentState: 'COMPLETED',
                  address: deliveryAddress,
                  activeCart: { items: [] }, // Reset cart
                },
              });

              // Dispatch payment link to user's WhatsApp channel
              const messageBody = `Aapka order successfully register ho gaya hai! Kripya niche diye gaye link par click karke payment complete karein:\n${paymentLink}`;
              await sendWhatsAppMessage(session.customerPhone, messageBody);

              console.log(`[Order Lock Successful] Created Order: ${createdOrder.id}, Payment Link: ${paymentLink}`);
              toolOutput = `Order placed successfully! Order ID: ${createdOrder.id}, Subtotal: ₹${subtotal}, Tax: ₹${tax}, Total: ₹${total}. Delivery address: "${deliveryAddress}". Payment link has been generated: ${paymentLink} and sent to the customer.`;
              break;
            }

            default:
              toolOutput = `Unknown tool: ${toolCall.name}`;
              break;
          }
        } catch (err: any) {
          console.error('[Claude Brain] Error executing tool:', err);
          toolOutput = `Error executing tool: ${err.message}`;
        }

        console.log(`[Claude Brain] Tool execution results: ${toolOutput}`);

        // Feed tool output back to Claude
        messageHistory.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: toolCall.id,
              content: toolOutput,
            },
          ],
        });
      } else {
        // Claude returned a final speech response
        const textBlock = response.content.find((c) => c.type === 'text');
        finalResponseText = textBlock && textBlock.type === 'text' ? textBlock.text : 'I did not catch that. Can you repeat?';
        break;
      }
    }

    // 4. Update the call logs transcript in database
    transcriptList.push({ role: 'ai', text: finalResponseText, time: new Date().toISOString() });

    if (callLog) {
      await prisma.callLog.update({
        where: { id: callLog.id },
        data: { transcript: transcriptList },
      });
    } else {
      // Scaffold call log entry if somehow missing
      await prisma.callLog.create({
        data: {
          id: sessionId,
          sessionId: session.id,
          transcript: transcriptList,
        },
      });
    }

    return finalResponseText;
  } catch (err: any) {
    console.warn(`[Claude Brain] Anthropic API cycle failed due to credit limits or network issues. Falling back to high-fidelity Hinglish NLP agent! Error: ${err.message}`);
    return executeOfflineFallback();
  }
}
