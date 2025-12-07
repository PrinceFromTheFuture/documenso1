import { mailer } from './mailer';

async function main() {
  try {
    await mailer.sendMail({
      to: [
        {
          name: 'בדיקת מערכת',
          address: 'isaac@computersplusplus.com',
        },
      ],
      from: {
        name: 'Tofes-Mekovan',
        address: process.env.NEXT_PRIVATE_SMTP_FROM_ADDRESS || 'noreply@tofes-mekovan.co.il',
      },
      subject: 'בדיקת שליחת מייל מהמערכת',
      html: '<b>זהו מייל בדיקה מהמערכת</b>',
      text: 'זהו מייל בדיקה מהמערכת',
    });
    console.log('המייל נשלח בהצלחה!');
  } catch (error) {
    console.error('שגיאה בשליחת המייל:', error);
  }
}

void main();
