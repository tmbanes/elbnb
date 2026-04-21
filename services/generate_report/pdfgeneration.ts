import puppeteer from 'puppeteer-core'

export async function generatePDF(
  Template: any,
  data: any
): Promise<Buffer> {

  const html = Template.render(data)//plot data to template

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser', // or '/usr/bin/chromium'
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()//open browser

  await page.setContent(html, {
    waitUntil: 'networkidle0'
  })

  const pdf = await page.pdf({//convert to pdf
    format: 'A4',//set size
    printBackground: true
  })

  await browser.close()

  return Buffer.from(pdf)
}