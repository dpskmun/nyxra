# Nyxra

A mailing client connected with github repo to send bulk mail, api mailing and scheduled mailing. It also support multiple smtp server or aws ses server. Its a pretty cool product to use in production use as it can send mail to updates folder and promotion folder too with a structured manner to track its analytics and much more cool features 

## TO Reviewer 

Its not fully completed only the github bot is left to control every aspect of it. Else I have teseted it fully with sending over 800 mails with 100% deverbility score as it doing a handshake. So it require port 25 to be openned 

And to test it i have made some endPoint 
https://unsubscribe.dpskmun.com/v1/mail

{
  name: "name",
  slug: "slug", # unique
  campaign_id: "abc", # for tracking not implemented use
  emailType: BULK || TRANSACTIONAL || LIST | SPAM
  category: "" not required for list spam or transactional
  sub_category: "" # same as above
  scheduleAt: "" # time
  transporter: {
    smtp: {

    },
    ses: {

    }
  },
  priority: HIGH || MEDIUM || LOW
  headers: {
    abc: abc
  },
  from: {
    name: "",
    email: "",
  },
  cc: ["",""],
  bcc: ["",""],
  replyTo: "",
  subject: "",
  html: "", # put raw link
  txt: "", # put raw link
  valueReplacer: false # if true then it will replace the value if there is csv 1st column must be emails then and 1row heading and all the data
  vlauesCsv: "", raw link
  attachments: [
    {
        filename: "",
        filelink: ""
    }
  ]
  icalEvent: {
    method: PUBLISH || REQUEST || CANCEL
    url: ""
    name: ""
  }
}

this data you need to pass through api so it will auto create a list of configuration and after passing email with second api it will auto send the email in api we can pass cutom header and other cutom configuration too 

I know its a bit complicated but msg me on slack I am happy to explaining you 