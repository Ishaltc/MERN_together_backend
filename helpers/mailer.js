const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const { OAuth2 } = google.auth;
const Oauth_link = "https://developers.google.com/oauthplayground";
const { EMAIL, MAILING_ID, MAILING_SECRET, MAILING_REFRESH } = process.env;

const auth = new OAuth2(
  MAILING_ID,
  MAILING_SECRET,
  MAILING_REFRESH,
  Oauth_link
);
exports.sentVerificationEmail = (email,name,url) => {
    auth.setCredentials({
        refresh_token:MAILING_REFRESH,
    })

    const accessToken = auth.getAccessToken();
    const stmp = nodemailer.createTransport({
       service: 'gmail',
       auth:{
        type:"OAuth2",
        user:EMAIL,
        clientId:MAILING_ID,
        clientSecret:MAILING_SECRET,
        refreshToken:MAILING_REFRESH,
        accessToken,
       },
    });
    const mailOptions = {
        from:EMAIL,
        to:email,
        subject:"Together email verification",
        html:`<div style="max-width:700px;margin-bottom:1rem;display:flex;align-items:center;gap:10px;font-family:Roboto;color:rgba(255,140,0,.995)"><img style="width:50px" src="https://res.cloudinary.com/df4mlwr6i/image/upload/v1663526483/samples/social%20media/t-1_mooll4.png" alt=""><span style="font-weight:500">Action require : Active your Together Account</span></div><div style="padding:1rem 0;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;color:#141823;font-size:17px;font-family:Roboto"><span style="font-weight:500">Hello ${name}</span><div style="padding:20px 0"><span style="padding:1.5rem 0;font-weight:500">You recently created an account on <span style="color:rgba(255,140,0,.995)">together</span>.To complete your registration, please confirm your account</span></div><a href=${url} style="width:200px;padding:10px 15px;background-color:rgba(255,140,0,.995);color:#fff;text-decoration:none;border-radius:5px;font-weight:600">Confirm your account</a><br><div style="padding-top:20px"><span style="margin:1.5rem 0;color:#898f9c">Together allows you to stay in touch with all your friends,once registered on together,you can share photos,organize events and much more.</span></div></div>`
    };
    stmp.sendMail(mailOptions,(err,res) => {
        if(err) return err;
        return res
    })
}

// for reset account password
exports.sentResetCode = (email,name,code) => {
    auth.setCredentials({
        refresh_token:MAILING_REFRESH,
    })

    const accessToken = auth.getAccessToken();
    const stmp = nodemailer.createTransport({
       service: 'gmail',
       auth:{
        type:"OAuth2",
        user:EMAIL,
        clientId:MAILING_ID,
        clientSecret:MAILING_SECRET,
        refreshToken:MAILING_REFRESH,
        accessToken,
       },
    });
    const mailOptions = {
        from:EMAIL,
        to:email,
        subject:"Reset Together password",
        html:`<div style="max-width:700px;margin-bottom:1rem;display:flex;align-items:center;gap:10px;font-family:Roboto;color:rgba(255,140,0,.995)"><img style="width:50px" src="https://res.cloudinary.com/df4mlwr6i/image/upload/v1663526483/samples/social%20media/t-1_mooll4.png" alt=""><span style="font-weight:500">Action require : Active your Together Account</span></div><div style="padding:1rem 0;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;color:#141823;font-size:17px;font-family:Roboto"><span style="font-weight:500">Hello ${name}</span><div style="padding:20px 0"><span style="padding:1.5rem 0;font-weight:500">You recently created an account on <span style="color:rgba(255,140,0,.995)">together</span>.To complete your registration, please confirm your account</span></div><a  style="width:200px;padding:10px 15px;background-color:rgba(255,140,0,.995);color:#fff;text-decoration:none;border-radius:5px;font-weight:600">${code}</a><br><div style="padding-top:20px"><span style="margin:1.5rem 0;color:#898f9c">Together allows you to stay in touch with all your friends,once registered on together,you can share photos,organize events and much more.</span></div></div>`
    };
    stmp.sendMail(mailOptions,(err,res) => {
        if(err) return err;
        return res
    })
}
