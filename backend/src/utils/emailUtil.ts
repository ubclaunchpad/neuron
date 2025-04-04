import nodemailer from "nodemailer";
import {GMAIL_ID, GMAIL_PASSWORD} from "../config/environment.js";
import { MailData } from "../common/types.js";
import { shiftModel, userModel } from "../config/models.js";
import { convertIndexToDay, getDateFromISOString } from "../utils/daysUtil.js";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: GMAIL_ID,
        pass: GMAIL_PASSWORD,
    },
});

async function volunteerAccountCreated(f_name: string, l_name: string, email: string) {
    const mailData = {
        email: email,
        subject: "Neuron - Account Created",
        message: `Hello ${f_name} ${l_name},<br><br>
                Your Neuron account has been created successfully.<br>
                Please wait for the team to verify your account. This usually takes around 3-4 hours.`,
    };

    await sendEmail(mailData);
}

async function newVolunteerToBeVerifiedByAdmins(f_name: string, l_name: string) {
    const admins = await userModel.getAllAdminUsers();

    if (!admins) {
        console.log("No admins found");
        return;
    }
    // join admin emails into a string
    const adminEmails = admins.map((admin) => admin.email).join(", ");
    const mailData = {
        email: adminEmails,
        subject: `Verify new volunteer account: ${f_name} ${l_name}`,
        message: `Hello BWP admin,<br><br>
        A new volunteer, ${f_name} ${l_name}, has an account pending verification. Please login to the platform to review and verify the account.`
    }

    await sendEmail(mailData);
}

async function volunteerAccountReactivateDeactivate(volunteer_id: string, status: string) {
    const user = await userModel.getUserByVolunteerId(volunteer_id);

    if (!user) {
        console.log("User not found");
        return;
    }

    const mailData = {
        email: user.email,
        subject: `Your account for BC Brain Wellness has been ${status}`,
        message: `Hello ${user.f_name} ${user.l_name},<br><br>
        This is a notice that your account for the BC Brain Wellness volunteer platform has been ${status} by BWP admins. ${status === "reactivated" ? "You may now can sign in to the platform and volunteer for classes again." : "You will no longer be able to sign in or volunteer for classes until your account is reactivated. Please reach out to the admins at [admin email] if you have any questions."} `
    }

    await sendEmail(mailData);
}

async function volunteerAccountVerified(volunteer_id: string) {
    const user = await userModel.getUserByVolunteerId(volunteer_id);

    if (!user) {
        console.log("User not found");
        return;
    }

    const mailData = {
        email: user.email,
        subject: "Your account for BC Brain Wellness has been verified",
        message: `Hello ${user.f_name} ${user.l_name},<br><br>
        Your account for the BC Brain Wellness volunteer platform has been verified by BWP admins. Please login to the platform to finish setting up your account.`
    }

    await sendEmail(mailData);
}

async function adminClicksNotifyInstructorForCoverage(request_id: number, volunteer_id: string) {
    const shift = await shiftModel.getShiftByRequestId(request_id);
    const user = await userModel.getUserByVolunteerId(volunteer_id);

    if (!shift) {
        console.log("Shift not found");
        return;
    }

    if (!user) {
        console.log("User not found");
        return;
    }

    const mailData = {
        email: shift.instructor_email,
        subject: `A volunteer is covering for one of your absent volunteers on ${getDateFromISOString(shift.shift_date)}`,
        message: `Hello ${shift.instructor_f_name} ${shift.instructor_l_name},<br><br>
        Your volunteer, ${shift.request_f_name} ${shift.request_l_name}, for your class ${shift.class_name}, will be absent on ${convertIndexToDay(shift.day)}, ${getDateFromISOString(shift.shift_date)}. They will be covered by ${user.f_name} ${user.l_name}. You may contact your coverage volunteer at ${user.email}.`
    }

    await sendEmail(mailData);
}

async function adminApprovesDeniesCoverage(request_id: number, volunteer_id: string, status: string) {
    const shift = await shiftModel.getShiftByRequestId(request_id);
    const user = await userModel.getUserByVolunteerId(volunteer_id);

    if (!shift) {
        console.log("Shift not found");
        return;
    }

    if (!user) {
        console.log("User not found");
        return;
    }

    const mailData = {
        email: user.email,
        subject: `Your request to cover ${shift.class_name} has been ${status}`,
        message: `Hello ${user.f_name} ${user.l_name},<br><br>
        Your request to cover a shift for ${shift.class_name} on ${convertIndexToDay(shift.day)}, ${getDateFromISOString(shift.shift_date)}, has been ${status} by BWP admins. ${status === "approved" ? "You are now listed as a volunteer for this shift. Please login to the platform to review the class details. You may reach out to the instructor of this class at [instructor email]." : "You will not be volunteering for this shift. Please reach out to the admins at [admin email] if you have any questions."}`
    }

    await sendEmail(mailData);
}

async function notifyVolunteersForShiftCoverage(request_id: number) {
    const shift = await shiftModel.getShiftByRequestId(request_id);
    const volunteers = await userModel.getAllVolunteerUsers();
    const volunteerEmails = volunteers.map((volunteer) => volunteer.email).join(", ");

    if (!shift) {
        console.log("Shift not found");
        return;
    }

    const mailData = {
        email: volunteerEmails,
        subject: `A BC Brain Wellness class on ${getDateFromISOString(shift.shift_date)} needs coverage!`,
        message: `Hello BWP Volunteer,<br><br>
        You are receiving this notification because a class, ${shift.class_name}, is in need of coverage on ${convertIndexToDay(shift.day)}, ${getDateFromISOString(shift.shift_date)}. Please login to the platform to view this class and request to cover the shift if you wish.`
    }

    await sendEmail(mailData);
}

async function adminClicksNotifyInstructorForAbsence(request_id: number) {
    const shift = await shiftModel.getShiftByRequestId(request_id);

    if (!shift) {
        console.log("Shift not found");
        return;
    }

    const mailData = {
        email: shift.instructor_email,
        subject: `A volunteer for your class will be absent on ${getDateFromISOString(shift.shift_date)}`,
        message: `Hello ${shift.instructor_f_name} ${shift.instructor_l_name},<br><br>
        Your volunteer, ${shift.request_f_name} ${shift.request_l_name}, for your class ${shift.class_name}, has indicated that they will be absent on ${convertIndexToDay(shift.day)}, ${getDateFromISOString(shift.shift_date)}. We will notify you when another volunteer is able to cover this shift.`
    }

    await sendEmail(mailData);
}

async function adminApprovesDeniesAbsence(request_id: number, status: string) {
    const shift = await shiftModel.getShiftByRequestId(request_id);

    if (!shift) {
        console.log("Shift not found");
        return;
    }
    
    const mailData = {
        email: shift?.request_email,
        subject: `Your absence request for ${shift.class_name} has been ${status}`,
        message: `Hello ${shift.request_f_name} ${shift.request_l_name},<br><br>
        Your absence request for ${shift.class_name} on ${convertIndexToDay(shift.day)}, ${getDateFromISOString(shift.shift_date)}, has been ${status} by BWP admins. ${status === "approved" ? "Please ensure that you make up for the missed hours by covering other shifts." : "You will remain as a volunteer for this shift. Please reach out to the admins at [admin email] if you have any questions."}`
    }

    await sendEmail(mailData);
}

async function volunteerRequestingCoverage(request_id: number, volunteer_id: string) {
    const shift = await shiftModel.getShiftByRequestId(request_id);
    const user = await userModel.getUserByVolunteerId(volunteer_id);
    const admins = await userModel.getAllAdminUsers();

    if (!shift) {
        console.log("Shift not found");
        return;
    }

    // join admin emails into a string
    const adminEmails = admins.map((admin) => admin.email).join(", ");
    const mailData = {
        email: adminEmails,
        subject: "A volunteer has requested to cover for a shift",
        message: `Hello BWP admin,<br><br>
        A volunteer, ${user.f_name} ${user.l_name}, has requested to cover the shift in ${shift.class_name} on ${convertIndexToDay(shift.day)}, ${getDateFromISOString(shift.shift_date)}. Please login to the platform to review and resolve this request.`
    };

    await sendEmail(mailData);
}

async function volunterRequestingAbsence(shift_id: number) {
    const shift = await shiftModel.getShiftInfo(shift_id);
    const admins = await userModel.getAllAdminUsers();

    if (!shift) {
        console.log("Shift not found");
        return;
    }

    // join admin emails into a string
    const adminEmails = admins.map((admin) => admin.email).join(", ");
    const mailData = {
        email: adminEmails,
        subject: "A volunteer has requested an absence for a shift",
        message: `Hello BWP admin,<br><br>
        A volunteer, ${shift.volunteer_f_name} ${shift.volunteer_l_name}, has requested an absence for their shift in ${shift.class_name} on ${convertIndexToDay(shift.day)}, ${getDateFromISOString(shift.shift_date)}. Please login to the platform to review and resolve this request.`
    };

    await sendEmail(mailData);
}

async function sendEmail(mailData: MailData) {
    console.log(mailData);
    const mailOptions = {
        from: '"Team Neuron" <neuronbc@gmail.com>',
        to: mailData.email,
        subject: mailData.subject,
        html: mailData.message + "<br><br>Best,<br>Team Neuron",
    };

    // Send the mail, ignore errors, not an important email
    await transporter.sendMail(mailOptions)
        .then(() => console.log("Email sent"))
        .catch(() => console.log("Email failed to send"));
}

export { sendEmail, volunterRequestingAbsence, volunteerRequestingCoverage, adminApprovesDeniesAbsence, adminApprovesDeniesCoverage, volunteerAccountVerified, volunteerAccountReactivateDeactivate, newVolunteerToBeVerifiedByAdmins, volunteerAccountCreated, adminClicksNotifyInstructorForCoverage, adminClicksNotifyInstructorForAbsence, notifyVolunteersForShiftCoverage };