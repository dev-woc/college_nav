import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
	if (!_resend) {
		if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
		_resend = new Resend(process.env.RESEND_API_KEY);
	}
	return _resend;
}

export async function sendScholarshipReminder({
	to,
	studentName,
	scholarshipName,
	amount,
	deadlineText,
	applicationUrl,
	daysUntil,
}: {
	to: string;
	studentName: string;
	scholarshipName: string;
	amount: string;
	deadlineText: string;
	applicationUrl: string;
	daysUntil: number;
}) {
	const resend = getResend();
	await resend.emails.send({
		from: "College Navigator <notifications@yourcollege.app>",
		to,
		subject: `Scholarship deadline in ${daysUntil} days: ${scholarshipName}`,
		html: `
      <h2>Hi ${studentName},</h2>
      <p>You have a scholarship deadline coming up in <strong>${daysUntil} days</strong>.</p>
      <h3>${scholarshipName}</h3>
      <p><strong>Amount:</strong> ${amount}</p>
      <p><strong>Deadline:</strong> ${deadlineText}</p>
      <p><a href="${applicationUrl}" style="background:#3b82f6;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Apply Now</a></p>
      <p style="color:#6b7280;font-size:12px">You received this because you matched this scholarship. Visit your dashboard to manage notifications.</p>
    `,
	});
}
