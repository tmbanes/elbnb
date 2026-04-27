//TODO: create template of reports to be generated
export default class BillingReceipt {
  static render(data: any) {
    return `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
            }

            .title {
              font-size: 22px;
              font-weight: bold;
              margin-bottom: 20px;
            }

            .row {
              margin-bottom: 10px;
            }

            .status {
              font-weight: bold;
              color: ${data.status?.toLowerCase() === 'paid' ? 'green' : 'red'};
            }

            .box {
              border: 1px solid #ddd;
              padding: 20px;
              border-radius: 8px;
              width: 400px;
            }
          </style>
        </head>

        <body>
          <div class="box">
            <div class="title">Billing Receipt</div>

            <div class="row">
              <b>Name:</b> ${data.first_name ?? ''} ${data.last_name ?? ''}
            </div>

            <div class="row">
              <b>Email:</b> ${data.email ?? ''}
            </div>

            <div class="row">
              <b>Status:</b> <span class="status">${data.status}</span>
            </div>

            <div class="row">
              <b>Amount:</b> ₱${data.amount ?? 0}
            </div>

            <div class="row">
              <b>Due Date:</b> ${data.due_date ?? ''}
            </div>
          </div>
        </body>
      </html>
    `
  }
}