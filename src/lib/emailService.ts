import type { Order } from "@/types";
import { formatCurrency } from "@/lib/utils";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY as string;
const FROM_EMAIL    = import.meta.env.VITE_BREVO_FROM_EMAIL as string ?? "noreply@pobla.ph";
const FROM_NAME     = "Pobla Order Hub";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function itemRows(order: Order): string {
  return order.items
    .map(
      (i) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0ebe9;font-size:14px;color:#3b3130;">
            ${i.menuItemName} × ${i.quantity}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #f0ebe9;font-size:14px;color:#3b3130;text-align:right;font-weight:600;">
            ${formatCurrency(i.subtotal)}
          </td>
        </tr>`
    )
    .join("");
}

function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0ef;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0ef;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(59,49,48,.08);">

        <!-- Header -->
        <tr>
          <td style="background:#3b3130;padding:28px 32px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:900;color:#ffffff;letter-spacing:2px;">POBLA</p>
            <p style="margin:4px 0 0;font-size:10px;font-weight:700;color:#bc5d5d;letter-spacing:4px;text-transform:uppercase;">ORDER HUB</p>
          </td>
        </tr>

        <!-- Title bar -->
        <tr>
          <td style="background:#bc5d5d;padding:14px 32px;">
            <p style="margin:0;font-size:16px;font-weight:700;color:#ffffff;">${title}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f5f0ef;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9c8f8e;">© 2025 Pobla Order Hub • Authentic Filipino Cuisine</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!BREVO_API_KEY) {
    console.warn("[emailService] VITE_BREVO_API_KEY not set — skipping email.");
    return;
  }
  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender:  { name: FROM_NAME, email: FROM_EMAIL },
      to:      [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("[emailService] Brevo error:", err);
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

/** Sent right after customer places order */
export async function sendOrderConfirmation(order: Order, customerEmail: string): Promise<void> {
  const body = `
    <p style="margin:0 0 6px;font-size:14px;color:#6b5f5e;">Hi <strong>${order.customerName}</strong>,</p>
    <p style="margin:0 0 20px;font-size:14px;color:#6b5f5e;">We received your order and are preparing it now!</p>

    <!-- Order info -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;background:#f9f5f4;border-radius:10px;padding:16px;">
      <tr>
        <td style="font-size:12px;color:#9c8f8e;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Order Number</td>
        <td style="font-size:16px;font-weight:900;color:#bc5d5d;text-align:right;">${order.orderNumber}</td>
      </tr>
      <tr>
        <td style="font-size:12px;color:#9c8f8e;padding-top:8px;">Order Type</td>
        <td style="font-size:13px;font-weight:600;color:#3b3130;text-align:right;padding-top:8px;text-transform:capitalize;">${order.orderType}</td>
      </tr>
      <tr>
        <td style="font-size:12px;color:#9c8f8e;padding-top:8px;">Payment</td>
        <td style="font-size:13px;font-weight:600;color:#3b3130;text-align:right;padding-top:8px;">Cash on Delivery</td>
      </tr>
      ${order.customerAddress ? `
      <tr>
        <td style="font-size:12px;color:#9c8f8e;padding-top:8px;">Delivery Address</td>
        <td style="font-size:13px;font-weight:600;color:#3b3130;text-align:right;padding-top:8px;">${order.customerAddress}</td>
      </tr>` : ""}
    </table>

    <!-- Items -->
    <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#9c8f8e;text-transform:uppercase;letter-spacing:1px;">Your Order</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      ${itemRows(order)}
      ${order.deliveryFee > 0 ? `
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#9c8f8e;">Delivery Fee</td>
        <td style="padding:8px 0;font-size:13px;color:#9c8f8e;text-align:right;">${formatCurrency(order.deliveryFee)}</td>
      </tr>` : ""}
      <tr>
        <td style="padding:12px 0 0;font-size:15px;font-weight:900;color:#3b3130;border-top:2px solid #3b3130;">TOTAL</td>
        <td style="padding:12px 0 0;font-size:15px;font-weight:900;color:#bc5d5d;text-align:right;border-top:2px solid #3b3130;">${formatCurrency(order.total)}</td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#9c8f8e;">Thank you for your order! We'll notify you when it's ready.</p>
  `;

  await sendEmail(
    customerEmail,
    ` Order Confirmed — ${order.orderNumber} | Pobla`,
    baseTemplate("Order Confirmed!", body)
  );
}

/** Sent when kitchen marks order as ready */
export async function sendOrderReadyNotification(order: Order, customerEmail: string): Promise<void> {
  const isDelivery = order.orderType === "delivery";
  const body = `
    <p style="margin:0 0 6px;font-size:14px;color:#6b5f5e;">Hi <strong>${order.customerName}</strong>,</p>
    <p style="margin:0 0 20px;font-size:14px;color:#6b5f5e;">
      ${isDelivery
        ? "Your order is ready and our rider is on the way!"
        : "Your order is ready for pickup!"}
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;background:#f0faf4;border-radius:10px;padding:16px;border:1px solid #bbf7d0;">
      <tr>
        <td style="font-size:12px;color:#166534;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Order Number</td>
        <td style="font-size:16px;font-weight:900;color:#166534;text-align:right;">${order.orderNumber}</td>
      </tr>
      <tr>
        <td style="font-size:12px;color:#166534;padding-top:8px;">Status</td>
        <td style="font-size:13px;font-weight:700;color:#166534;text-align:right;padding-top:8px;">
          ${isDelivery ? " Out for Delivery" : " Ready for Pickup"}
        </td>
      </tr>
      <tr>
        <td style="font-size:12px;color:#166534;padding-top:8px;">Total to Pay</td>
        <td style="font-size:15px;font-weight:900;color:#166534;text-align:right;padding-top:8px;">${formatCurrency(order.total)}</td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#9c8f8e;">
      ${isDelivery
        ? "Please prepare <strong>" + formatCurrency(order.total) + "</strong> for Cash on Delivery."
        : "Please bring your order number when you come. Thank you!"}
    </p>
  `;

  await sendEmail(
    customerEmail,
    ` Order Ready — ${order.orderNumber} | Pobla`,
    baseTemplate(isDelivery ? "On the Way! " : "Ready for Pickup! ", body)
  );
}