const express = require('express');

const router = express.Router();
const bcrypt = require('bcryptjs');
const Talk = require('talkjs');
var bodyParser = require('body-parser');

const https = require("https");
const qs = require("querystring");

const checksum_lib = require("../Paytm/checksum");
const config = require("../Paytm/config");

const parseUrl = express.urlencoded({ extended: false });
const parseJson = express.json({ extended: false });

const accountSid = 'AC915bfbdb9aa1692c0971a8e32f9ed15a'; 
const authToken = 'ddca9b85a8a9813fa9d1d4dc3f02c2d4'; 
const client = require('twilio')(accountSid, authToken); 
const axios = require('axios');

router.use(bodyParser.urlencoded({ extended: false }));

 
const db = require("../models/db");
const { redirectLogin } = require('../config/auth');
const { redirectHome } = require('../config/auth');


router.get('/login', redirectHome, (req, res) => res.render('login'));


router.get('/register', redirectHome, (req, res) => res.render('register'));

router.post('/register', (req, res) => {
    const { name, email, phone, password, password2 } = req.body;
    let errors = []




    if (phone.length !== 10) {
        errors.push({ msg: 'Enter your 10 digit-phone number ' })
    }
    if (password !== password2) {
        errors.push({ msg: 'passwords dont match ' });
    }

    if (errors.length > 0) {
        res.render('register', {
            errors,
            name,
            email,
            phone,
            password,
            password2
        })
    }
    else {



        const { name, email, phone, password, password2 } = req.body;

        var q1 = 'select mobile_no from users where mobile_no= ?';
        db.query(q1, [phone], async (err, results) => {
            if (err) console.log(err);

            if (results.length > 0) {
                errors.push({ msg: 'This number is already registered ' })
                return res.render('register', {
                    errors,
                    name,
                    email,
                    phone,
                    password,
                    password2
                })
            }



            let hashedpassword = await bcrypt.hash(password, 8);


            var q2 = 'insert into users set ?'
            db.query(q2, { user_name: name, email: email, mobile_no: phone, password: hashedpassword }, (err, results) => {
                if (err) {
                    console.log(err);

                }
                else {
                    console.log(req.body);
                    console.log('registered');
                    return res.redirect('/users/login')
                }
            })


        })




    }


})
router.post('/login', (req, res, next) => {
    try {
        let errors = []
        const phone = req.body.phone;
        const password = req.body.password;
        const choice = req.body.choice;

        db.query('Select * from users where mobile_no = ?', [phone], async (err, results) => {
            
             
            if (results.length ==0) {
                console.log('no results');
                errors.push({ msg: 'mobile number or password incorrect' })
                return res.status(401).render('login', { errors, phone });
            }
            else {
                if (!(await bcrypt.compare(password, results[0].password))) {
                    errors.push({ msg: 'mobile number or password incorrect' })
                    return res.status(401).render('login', { errors, phone });
                }
                else {
                    req.session.userdetails = results[0];
                    if (choice == 'choice1') {
                        req.session.usertype = 'helper';
                        return res.redirect('/dashboard2');
                    }
                    else if (choice == 'choice2') {
                        req.session.usertype = 'help_seeker';
                        return res.redirect('/dashboard');
                    }

                }

            }

        })
    } catch (error) {
        console.log('error');
    }
})

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/dashboard')
        }
        else {
            res.clearCookie('sid');
            return res.redirect('/users/login');
        }




    })


})

router.get('/request_buy', redirectLogin, (req, res) => {
    let user = req.session.userdetails;
    res.render('request_buy', { user })
})

router.post('/request_buy', redirectLogin, (req, res) => {

   if(req.file)
   console.log("file " + req.file );
    var pimage_path;
    if (req.file)
        pimage_path = req.file.path;

    let user = req.session.userdetails;

  console.log(req.body);
    const { pname, pprice, pdesc, pimage, rprice,address1, lat1, lng1,address2, lat2, lng2 } = req.body;
    var query = "insert into buy_request set ?";
    db.query(query, { buyer: user.id, pname: pname, pprice: pprice, pdesc, rprice, lat1, lng1, lat2, lng2, pimage: pimage_path,address1,address2 }, (err, results) => {
        if (err)
            console.log(err);
        else {
            let success_msg;
            success_msg = { msg: 'Successfully done!! Please wait for your helper!' }
                return res.status(200).render('dashboard', { success_msg, user});
        }
    });



})

router.get('/helper', (req, res) => {
    let user = req.session.userdetails;
    res.render('helper', { user })
})

router.post('/helper', redirectLogin, (req, res) => {

    let user = req.session.userdetails;
    console.log(user.phone);

    const { lat1, lng1, lat2, lng2 } = req.body;
    var query = "insert into helper_details set ?";
    var helper = { hid: user.id, lat1, lng1, lat2, lng2 }
    req.session.helper = helper;
    db.query(query, { hid: user.id, lat1, lng1, lat2, lng2 }, (err, results) => {
        if (err)
            console.log(err);
        else {
            res.redirect('/users/listrequest');
        }
    });
})

router.get('/listrequest', redirectLogin, (req, res) => {
    if (!req.session.helper)
        res.redirect('/users/helper')

    var user = req.session.userdetails;
    var helper = req.session.helper;
    var query3 = "select *, round((0.7*( 6371 * acos ( cos ( radians(" + helper.lat2 + ") ) * cos( radians( lat1 ) ) * cos( radians( lng1 ) - radians(" + helper.lng2 + ") ) + sin ( radians(" + helper.lat2 + ") ) * sin( radians( lat1 ) ) ) ) + 0.3*( 6371 * acos ( cos ( radians(" + helper.lat1 + ") ) * cos( radians( lat2 ) ) * cos( radians( lng2 ) - radians(" + helper.lng1 + ") ) + sin ( radians(" + helper.lat1 + ") ) * sin( radians( lat2 ) ) ) )),2)AS distance FROM  buy_request order by distance;"
    db.query(query3, (err, results) => {
        if (err) {
            console.log(err);
            return res.redirect('/users/helper' );
        }
        else {

            return res.render('list_of_request', { user, helper, results })
        }

    })

})

router.get('/check_req', (req, res) => {
    let errors = []
    let user = req.session.userdetails;
    var check = "select user_name,mobile_no from users where id in (select helper_id from request_list where buyer = " + user.id + ")";
    db.query(check, (err, results) => {
        if (err) {
            console.log(err);
        }
        else {
            if (results.length == 0) {
                errors.push({ msg: 'No requests yet' })

                return res.status(401).render('dashboard', { errors, user });

            }

            else {
                res.redirect('/users/chat');
            }
        }
    })
})

router.get('/current_activity', (req, res) => {
    let errors = []
    let user = req.session.userdetails;
    var check = "select user_name,mobile_no from users where id in (select buyer from ongoing_requests where helper_id = " + user.id + ")" ;
    var query22 = " select * from buy_request where id in (SELECT prod_id FROM  ongoing_requests where helper_id = "+user.id+" )";
    db.query(check, (err, results) => {
        if (err) {
            console.log(err);
        }
        else {
             db.query(query22,(eror,prods)=>{
                 if(eror)
                 {
                     console.log(eror);
                 }
                 else{
                     console.log(results);
                     console.log(prods);
                     res.render('current_activity',{user,results,prods});
                 }
             })
        }
    })
})



router.post('/add_req', (req, res) => {
    let user = req.session.userdetails;
    let buyer_id = req.body.buyer;
    let id = req.body.id;
    ;
    var query = 'Insert into ongoing_requests set?';
    db.query(query, { prod_id: id, helper_id: user.id, buyer: buyer_id }, (err, results) => {
        if (err) {
            console.log(err);
        }
        else {
            let get_query = 'Select * from users where id = ' + buyer_id + ' ';
            db.query(get_query, (err, results) => {
                if (err) {
                    console.log(err);
                }
                else {
                    
                   
                    let other_user = results[0];
                    console.log(other_user);


          
                client.messages 
                .create({ 
                   body: 'Your buy request is is seen by another user and he is is willing to help you..Please login to chat with him',
                   from: '+13094296105',       
                   to: '+918838346328'
               
                 }) 
                .then(message => console.log(message.sid))
                .done();

                    return res.redirect('chat_helper?other_user='+JSON.stringify(other_user) );
                }
            })

        }
    })

})

router.get('/pay', (req, res) => res.render('payment'));



router.post("/paynow", [parseUrl, parseJson], (req, res) => {
    // Route for making payment
  
    var paymentDetails = {
      amount: req.body.amount,
      customerId: req.body.name,
      customerEmail: req.body.email,
      customerPhone: req.body.phone
  }
  if(!paymentDetails.amount || !paymentDetails.customerId || !paymentDetails.customerEmail || !paymentDetails.customerPhone) {
      res.status(400).send('Payment failed')
  } else {
      var params = {};
      params['MID'] = config.PaytmConfig.mid;
      params['WEBSITE'] = config.PaytmConfig.website;
      params['CHANNEL_ID'] = 'WEB';
      params['INDUSTRY_TYPE_ID'] = 'Retail';
      params['ORDER_ID'] = 'TEST_'  + new Date().getTime();
      params['CUST_ID'] = paymentDetails.customerId;
      params['TXN_AMOUNT'] = paymentDetails.amount;
      params['CALLBACK_URL'] = 'http://localhost:7000/users/success_pay';
      params['EMAIL'] = paymentDetails.customerEmail;
      params['MOBILE_NO'] = paymentDetails.customerPhone;
  
  
      checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {
          var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
          // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production
  
          var form_fields = "";
          for (var x in params) {
              form_fields += "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
          }
          form_fields += "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";
  
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.write('<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' + txn_url + '" name="f1">' + form_fields + '</form><script type="text/javascript">document.f1.submit();</script></body></html>');
          res.end();
      });
  }
  });
  router.post("/success_pay",(req,res)=>{
      res.send("Payment successful");
  })
  
  router.post("/callback", (req, res) => {
    // Route for verifiying payment
  
    var body = '';
  
    req.on('data', function (data) {
       body += data;
    });
  
     req.on('end', function () {
       var html = "";
       var post_data = qs.parse(body);
  
       // received params in callback
       console.log('Callback Response: ', post_data, "\n");
  
  
       // verify the checksum
       var checksumhash = post_data.CHECKSUMHASH;
       // delete post_data.CHECKSUMHASH;
       var result = checksum_lib.verifychecksum(post_data, config.PaytmConfig.key, checksumhash);
       console.log("Checksum Result => ", result, "\n");
  
  
       // Send Server-to-Server request to verify Order Status
       var params = {"MID": config.PaytmConfig.mid, "ORDERID": post_data.ORDERID};
  
       checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {
  
         params.CHECKSUMHASH = checksum;
         post_data = 'JsonData='+JSON.stringify(params);
  
         var options = {
           hostname: 'securegw-stage.paytm.in', // for staging
           // hostname: 'securegw.paytm.in', // for production
           port: 443,
           path: '/merchant-status/getTxnStatus',
           method: 'POST',
           headers: {
             'Content-Type': 'application/x-www-form-urlencoded',
             'Content-Length': post_data.length
           }
         };
  
  
         // Set up the request
         var response = "";
         var post_req = https.request(options, function(post_res) {
           post_res.on('data', function (chunk) {
             response += chunk;
           });
  
           post_res.on('end', function(){
             console.log('S2S Response: ', response, "\n");
  
             var _result = JSON.parse(response);
               if(_result.STATUS == 'TXN_SUCCESS') {
                   res.send('payment sucess')
               }else {
                   res.send('payment failed')
               }
             });
         });
  
         // post the data
         post_req.write(post_data);
         post_req.end();
        });
       });
  });
  
 

router.get('/chat_helper',redirectLogin,(req,res)=>{
    var user = req.session.userdetails;
    console.log(req.query.other_user);
    var other_user=   req.query.other_user;
    res.render('chat_helper', { user, other_user });
})
router.get('/chat_helpseeker',redirectLogin,(req,res)=>{
    var user = req.session.userdetails;
    res.render('chat_helpseeker',{user});
})

router.get('/current_request',redirectLogin,(req,res)=>{
    var user = req.session.userdetails;
    var sqlquery=" select * from buy_request where buyer=" + user.id;
    db.query(sqlquery,(err,results)=>{
        if(err)
        {
            console.log(err);
        }
        else
        {
            console.log(results);
            return res.render('current_request',{user,results:results});
        }
    })
    
})


module.exports = router;
