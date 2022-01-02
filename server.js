const express = require('express');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

mongoose.connect('mongodb://localhost/razorpay').then(()=>{
  console.log(`mongodb connected`);
});

app.use(express.json({extended:false}));

const OrderSchema = mongoose.Schema({
    isPaid:Boolean,
    amount:Number,
    razorpay:{
        orderId:String,
        paymentId:String,
        signature:String,
    },
})

const Order = mongoose.model('Order',OrderSchema);

app.get('/get-razorpay-key',(req,res)=>{
    res.send({key:process.env.RAZORPAY_KEY_ID});
});


app.post('/create-order',async(req,res)=>{
  try {
      const instance = new Razorpay({
          key_id:process.env.RAZORPAY_KEY_ID,
          key_secret:process.env.RAZORPAY_KEY_SECRET
      });
      const options = {
          amount : req.body.amount,
          currency :'INR'
      };
      const order = await instance.orders.create(options);

      if(!order) return res.status(500).send({msg:'Some Error Occured'});
      
      res.send(order);

  } catch (error) {
      res.status(500).send({err:error});
  }
});


app.post('/pay-order',async (req,res)=>{
try {
    const {amount,razorpayPaymentId,razorpayOrderId,razorpaySignature}= req.body;

    const newPayment = Order({
        isPaid:true,
        amount:amount,
        razorpay:{
            orderId:razorpayOrderId,
            paymentId:razorpayPaymentId,
            signature:razorpaySignature,
        },
    });

    await newPayment.save();
    
    res.send({
        msg:'Payment was successfull',
    });
} catch (error) {
    console.log(error);
    res.status(500).send(error);
}
});

app.get('/list-orders',async(req,res)=>{
   const orders = await Order.find();
   res.send(orders);
});

app.listen(5000,()=>{
    console.log(`server is running at 5000`);
})
