const mongoose = require("mongoose");
const Consignment=require('../../consignment/model/contraveldetails')
const ride=require('../../user/model/traveldetails')
const user=require('../../user/model/Profile')


const NotificationSchema = new mongoose.Schema({
    phoneNumber: { type: String,ref:user },
    consignmentId: { type: String, ref: Consignment},
    rideId:{type:String,ref:ride},
    travelId:{type:String},
    requestedby:{type:String},
    requestto:{type:String},
    
    earning:{type:String},
    status:{
        type: String,
        enum: ["Pending", "Accepted", "Rejected","Approved"],
        default: "Pending"
    },
    notificationType: {
        type: String,
        enum: ["consignment_request", "ride_request", "ride_accept", "ride_reject","consignment_accept","consignment_reject"],
        
    },
    pickup:{type:String},
    dropoff:{type:String},
    travelmode:{type:String},
    travellername:{type:String},
    pickuptime:{type:String},
    dropofftime:{type:String},
    
    isRead: { type: Boolean, default: false },
    createdAt: {
  type: Date,
  default: Date.now
}
    
    
    
    
},{timestamps:true});

module.exports = mongoose.model("Notification", NotificationSchema);
