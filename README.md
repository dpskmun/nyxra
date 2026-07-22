# Nyxra

A mailing client connected with github repo to send bulk mail, api mailing and scheduled mailing. It also support multiple smtp server or aws ses server. Its a pretty cool product to use in production use as it can send mail to updates folder and promotion folder too with a structured manner to track its analytics and much more cool features 

## TO Reviewer 

Its not fully completed only the github bot is left to control every aspect of it. Else I have teseted it fully with sending over 800 mails with 100% deliverability score as it doing a handshake. So it require port 25 to be openned in vm

And to test it i have made some endPoint 

some data you need to pass through api so it will auto create a list of configuration and after passing email with second api it will auto send the email in api we can pass cutom header and other cutom configuration too 

I know its a bit complicated but msg me on slack I am happy to explaining you 

### How to run

If you have smtp or ses creds put here only 1 smtp or ses and change other config if you want

https://unsubscribe.dpskmun.com/v1/mail/create
```
{
  "name": "dev",
  "slug": "dev", # unique
  "campaign_id": "dev",  # for tracking not implemented use
  "emailType": "BULK", 
  "category": "marketing", #not required for list spam or transactional
  "sub_category": "newsletter", #not required for list spam or transactional
  "transporter": { 
    "smtp": {
        "host": "",
        "port": "",
        "secure": "",
        "user": "",
        "pass": "",
        "rateLimitMS": 3000
    },
    "ses": {
        "region": "",
        "accessKeyId": "",
        "secretAccessKey": "",
        "rateLimitMS": 3000
    }
  },
  "priority": "HIGH",
  "headers": {
    "name": "Test"
  },
  "from": {
    "name": "",
    "email": ""
  },
  "subject": "A MAIL TEST",
  "html": "https://gist.githubusercontent.com/CodingWithHardik/569d42dd95bcb5c8f8828f5cae87e97e/raw/b28678d6f02cdb3c98c9742d1c739f7089dc5f82/gistfile1.txt",
  "txt": "https://gist.githubusercontent.com/CodingWithHardik/ff24fa374b33ee07fb76e7772da4a64d/raw/4f8a961ba2162a7409f2ae7d4f296f11ffcc0c12/gistfile1.txt",
  "valueReplacer": true 
}
```
### CURL
```
curl --location 'https://unsubscribe.dpskmun.com/v0/mail/create' \
--header 'Content-Type: application/json' \
--data-raw '{
  "name": "dev",
  "slug": "dev",
  "campaign_id": "dev",
  "emailType": "BULK", 
  "category": "marketing",
  "sub_category": "newsletter",
  "transporter": { 
    "smtp": {
        "host": "",
        "port": "",
        "secure": "",
        "user": "",
        "pass": "",
        "rateLimitMS": 3000
    },
    "ses": {
        "region": "",
        "accessKeyId": "",
        "secretAccessKey": "",
        "rateLimitMS": 3000
    }
  },
  "priority": "HIGH",
  "headers": {
    "name": "Test"
  },
  "from": {
    "name": "",
    "email": ""
  },
  "subject": "A MAIL TEST",
  "html": "https://gist.githubusercontent.com/CodingWithHardik/569d42dd95bcb5c8f8828f5cae87e97e/raw/b28678d6f02cdb3c98c9742d1c739f7089dc5f82/gistfile1.txt",
  "txt": "https://gist.githubusercontent.com/CodingWithHardik/ff24fa374b33ee07fb76e7772da4a64d/raw/4f8a961ba2162a7409f2ae7d4f296f11ffcc0c12/gistfile1.txt",
  "valueReplacer": true 
}'
```

in the above code, please fill smtp or ses and remove one 
**IF not having smtp or ses creds**

Dont create custom config i have already made for you
x-nyxra-key
```2aee90a92f98d0be7394654c27a397c7702b47183ba9e015362fe6bcd607a8aa934d01c1```
now to send replace key with my key 
change email name and just send the req 

there is a issue currently like you can only send 1 mail per 1 email address in 1 configuration creation  
this is because its was structred in bulk mailing but backend code include sending bulk mailing and sending mail through api it would be fixed later 
```
curl --location 'https://unsubscribe.dpskmun.com/v1/mailer/send' \
--header 'x-nyxra-key: 2aee90a92f98d0be7394654c27a397c7702b47183ba9e015362fe6bcd607a8aa934d01c1' \
--header 'Content-Type: application/json' \
--data-raw '{
    "emailId": "hardikgupta2232@gmail.com",
    "apiValueReplace": [
        {
            "key": "NAME",
            "value": "Hardik"
        }
    ]
}'
```

Video
[Watch the demo on YouTube](https://youtu.be/Sc0n_hJd4Bo)

Read the docs
[Docs](./DOCS.md)
