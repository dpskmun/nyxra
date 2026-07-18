# `/mail/create` EndPoint

## Use to create pre-ready configuration to send mail in future

### Requirements :-<br/>

BODY :(required)-<br/>

```
name: "",(required)
slug: "" (unique)(required)
campaign_id: "" (required)
emailType: "" BULK | TRANSACTIONAL | LIST | SPAM  (required)
category: "" (not-required for spam and transactional mail)
sub_category: "" (not-required for spam and transactional mail)
scheduleAt: "" #used for scheduling email
transporter: {
    smtp: {
        host: ""
        port: ""
        secure: true
        user: ""
        pass: ""
        rateLimitMS: 0000
    },
    ses: {
     region: ""
     accessKeyId: "",
     secretAccessKey: "",
     rateLimitMS: 0000,
    }
}
priority: HIGH | MEDIUM | LOW
headers: [
    'ww': "EE"
]
from: {
    name: "",
    email: ""
}
cc: [""],
bcc: [""],
replyTo: "",
subject: "",
html: "" #raw link
txt: "" #raw link
valueReplacer: true / false # depebds if you want to change text in mail or not
vlauesCsv: "",
attachments: [
    {
        filename: "",
        filelink: "" # raw
    }
]
icalEvent: {
    name: "",
    url: "", # RAW LINK
    method: PUBLISH | REQUEST | CANCEL
}
```

# `/mailer/send` EndPoint

## Used to send mail

### Requirements :-<br/>

BODY :-<br/>

```
emailId : your-email (required)
apiValueReplace: [ (optional)
    {
        key: "",
        value: ""
    }
]
apiMailHeaders: [ (optional)
    {
        key: "",
        value: ""
    }
]
apiIcalEvent: { (optional)
    name: "",
    methond: "", PUBLISH | REQUEST | CANCEL
    url: "" #raw file url
}
apiAttachments: [ (optional)
    {
        filename: "",
        filelink: "" # raw file url
    }
]
```

Headers:
`x-nyxra-key` : `your-api`


# BULK MAILING WITHOUT API

create data in configuration
then put all email connected to configuration in github 
run the workflow by lpop