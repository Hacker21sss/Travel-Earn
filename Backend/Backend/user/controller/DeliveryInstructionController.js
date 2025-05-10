const Instruction = require('../model/DeliveryInstruction');
const Notification = require('../../user/model/notification');
const User = require('../../user/model/Profile');
const consignment = require('../../consignment/model/contraveldetails');
const earning=require('../../traveller/model/Earning');
const consignmenthistory=require('../../consignment/model/conhistory')
const travelhistory=require('../../user/model/travel.history')
const currentime=require('../../service/getcurrentdatetime')
const riderequest=require('../../consignment/model/riderequest');
const traveldetails = require('../model/traveldetails');
const consignmenttocarry=require('../../traveller/model/consignmenttocarry')


// const startRide = async (req, res) => {
//   try {
//     const { status } = req.body;
//     const { travelId } = req.query;

//     // Validate inputs
//     if (!travelId) {
//       return res
//         .status(400)
//         .json({ status: "error", message: "Travel ID is required" });
//     }
//     if (!status) {
//       return res
//         .status(400)
//         .json({ status: "error", message: "Status is required" });
//     }
//     if (status.toLowerCase() !== "started") {
//       return res
//         .status(400)
//         .json({ status: "error", message: "Status must be 'started'" });
//     }

//     // Find travel
//     const travel = await traveldetails.findOne({ travelId }).lean();
//     if (!travel) {
//       console.log(`Travel not found for travelId: ${travelId}`);
//       return res
//         .status(404)
//         .json({ status: "error", message: "Travel not found" });
//     }

   
//     if (travel.status === "started") {
//       console.log(`Travel already started for travelId: ${travelId}`);
//       return res.status(400).json({
//         status: "error",
//         message: "Travel already started",
//         startedAt: travel.startedat || "Unknown",
//       });
//     }

//     // Update travel status and start time
//     const startTime = new Date();
//     const updateResult = await TravelDetails.updateOne(
//       { travelId },
//       {
//         $set: {
//           status: "started",
//           startedat: startTime,
//         },
//       }
//     );

//     if (updateResult.matchedCount === 0) {
//       console.log(`Failed to update travel for travelId: ${travelId}`);
//       return res
//         .status(500)
//         .json({ status: "error", message: "Failed to update travel" });
//     }

//     console.log(`Travel started for travelId: ${travelId} at ${startTime}`);
//     return res.status(200).json({
//       status: "success",
//       data: {
//         message: "Travel started",
//         travelId,
//         startTime: startTime.toISOString(),
//       },
//     });
//   } catch (error) {
//     console.error(`Error starting travel for travelId: ${req.query.travelId}`, error);
//     return res
//       .status(500)
//       .json({ status: "error", message: "Internal server error" });
//   }
// };
    
// const endride=async(req,res)=>{
//     const {travelId}=req.query();
//     const {status}=req.body;
//     if(!travelId || !status){
//         return res.status(400).json({message:"Please fill all fields"});
//     }
//     const travel=await traveldetails.findOne({travelId});
//     if(!travel){
//         return res.status(404).json({ message: "Travel not found" });
//     }
//     const endTime = currentime.getCurrentDateTime(); 
//     await travel.updateOne(
//         {travelId},
//         {$set: { status: "Finished",
//         endedat:endTime }}
//     )
//     return res.status(200).json({message:"travel ended",endTime});
// };

const moment = require("moment");
const getCurrentDateTime = () => new Date().toISOString();
  
  const pickupconsignment = async (req, res) => {
    try {
      const { travelId, consignmentId } = req.query;
      const { status, otp } = req.body;
  
      // Validate required parameters
      if (!travelId || !consignmentId || !status) {
        return res
          .status(400)
          .json({ message: "Missing travelId, consignmentId, or status" });
      }
  
      // Find consignment to carry
      const consignmentToCarry = await consignmenttocarry.findOne({ consignmentId });
      if (!consignmentToCarry) {
        return res.status(404).json({ message: "Consignment not found" });
      }
  
      // Find main consignment details
      const Consignment = await consignment.findOne({ consignmentId });
      if (!Consignment) {
        return res.status(404).json({ message: "Consignment details not found" });
      }
  
      // Find travel details
      const travel = await traveldetails.findOne({ travelId });
      if (!travel) {
        return res.status(404).json({ message: "Travel not found" });
      }
  
      // Check travel status
      if (travel.status !== "started") {
        return res
          .status(400)
          .json({ message: "Cannot pick up consignment before starting the travel" });
      }
  
      // Validate OTP
      if (otp !== Consignment.sotp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }
  
      // Determine new status
      let newStatus;
      switch (status.toLowerCase()) {
        case "pending":
          newStatus = "Collected";
          break;
        case "collected":
          newStatus = "collected";
          break;
        case "completed":
          newStatus = "Delivered";
          break;
        default:
          return res.status(400).json({ message: "Invalid status transition" });
      }
  
      const pickupTime = getCurrentDateTime();
  
      // Update consignment history
      const updateResult = await consignmenthistory.updateOne(
        { "traveldetails.travelId": travelId, consignmentId },
        {
          $set: {
            status: newStatus,
            collected: pickupTime,
          },
          $push: {
            statusHistory: {
              status: newStatus,
              time: pickupTime,
            },
          },
        },
        { upsert: true }
      );
      const updateResult1 = await consignmenttocarry.updateOne(
        {  travelId, consignmentId },
        {
          $set: {
            status: newStatus,
            consignmentpickuptime: pickupTime,
          },
          // $push: {
          //   statusHistory: {
          //     status: newStatus,
          //     time: pickupTime,
          //   },
          // },
        },
        { upsert: true }
      );
  
      if (updateResult.modifiedCount === 0 && updateResult.upsertedCount === 0 &&updateResult1.modifiedCount === 0) {
        return res.status(400).json({ message: "Failed to update consignment status" });
      }
  
      console.log(
        `Consignment Updated - Travel ID: ${travelId}, Consignment ID: ${consignmentId}, New Status: ${newStatus}`
      );
  
      // Prepare response matching UI
      const responseData = {
        message: "Consignment status updated successfully",
        travelId,
        consignmentId,
        status: newStatus,
        statusHistory: [
          {
            status: "Collected",
            time: currentime.getCurrentDateTime(), // Example from UI
          },
          {
            status: "Completion Pending",
           
          },
        ],
        pickup: {
          name: consignmentToCarry?.sender || "Gaurish Banga",
          phone: consignmentToCarry?.senderphone || "+91-9873738032",
          location: Consignment?.startinglocation || "Kashmiri Gate ISBT, New Delhi",
        },
        drop: {
          name: consignmentToCarry?.receiver || "Aryan Singh",
          phone: consignmentToCarry?.receiverphone || "+91-9873738032",
          location: Consignment?.goinglocation || "Amritsar Bus Terminal",
        },
        description: Consignment?.description || "Lorem ipsum dolor sit amet consectetur. Tincidunt nec maecenas.",
        weight: Consignment?.weight || "2 Kg",
        dimensions: Consignment?.dimensions || "10x10x12",
        handleWithCare: Consignment?.handleWithCare || "Yes",
        specialRequest: Consignment?.specialRequest || "No",
        dateOfSending: Consignment?.dateOfSending
          ? moment(Consignment.dateOfSending).format("DD/MM/YYYY")
          : "21/01/2024",
        expectedEarning: Consignment.earning || "₹500",
      };
  
      return res.status(200).json(responseData);
    } catch (error) {
      console.error("Error updating consignment status:", error.message);
      if (!res.headersSent) {
        return res
          .status(500)
          .json({ message: "Internal server error", error: error.message });
      }
    }
  };

  const deliver = async (req, res) => {
    try {
      const { travelId, consignmentId } = req.query;
      const { status, otp } = req.body;
  
      const con = await consignmenttocarry.findOne({ consignmentId });
      if (!con) {
        return res.status(404).json({ message: "Consignment not found" });
      }
      const cons = await consignment.findOne({ consignmentId });
  
      const travel = await traveldetails.findOne({ travelId });
      if (!travel) {
        return res.status(404).json({ message: "Travel not found" });
      }
  
      if (travel.status !== "started") {
        return res.status(400).json({ message: "Cannot pick up consignment before starting the travel" });
      }
  
      if (otp !== cons.rotp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }
  
      let newStatus;
      if (status === "Completed") {
        newStatus = "Delivered";
      } else {
        return res.status(400).json({ message: "Invalid status transition" });
      }
  
      const deliveredTime = new Date().toISOString();
  
      const updateResult = await Promise.all([
        consignmenthistory.updateOne(
          { "traveldetails.travelId": travelId },
          { $set: { status: newStatus, delivered: deliveredTime } }
        ),
        consignmenttocarry.updateOne(
          { consignmentId },
          { $set: { status: newStatus, updatedAt: deliveredTime } }
        ),
      ]);
  
      if (updateResult[0].modifiedCount === 0 || updateResult[1].modifiedCount === 0) {
        return res.status(400).json({ message: "Failed to update consignment status" });
      }
  
      // const notificationTraveler = new Notification({
      //   travelId,
      //   consignmentId,
      //   phoneNumber: travel.phoneNumber,
      //   status: "Delivered",
      //   notificationType: "consignment_delivered",
      //   createdAt: new Date(),
      //   pickup: cons.startinglocation,
      //   dropoff: cons.goinglocation,
      //   travelmode: travel.travelMode,
      // });
  
      // const notificationOwner = new Notification({
      //   travelId,
      //   consignmentId,
      //   phoneNumber: cons.phoneNumber,
      //   status: "Delivered",
      //   notificationType: "consignment_delivered_owner",
      //   createdAt: new Date(),
      //   pickup: cons.startinglocation,
      //   dropoff: cons.goinglocation,
      //   travelmode: travel.travelMode,
      // });
  
      // await Promise.all([
      //   notificationTraveler.save(),
      //   notificationOwner.save(),
      // ]);
  
      // let io = getIO();
      // io.emit("consignmentDelivered", { travelId, consignmentId });
  
      console.log(`Consignment Updated - Travel ID: ${travelId}, Consignment ID: ${consignmentId}, New Status: ${newStatus}`);
  
      return res.status(200).json({
        message: "Consignment status updated successfully",
        travelId,
        consignmentId,
        status: newStatus,
      });
  
    } catch (error) {
      console.error("Error updating consignment status:", error.message);
      if (!res.headersSent) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
      }
    }
  };


    




// Controller to fetch consignment status
const setconsignmetstatus = async (req, res) => {
  try {
      const { phoneNumber } = req.params;
      const { consignmentId } = req.query;

      if (!phoneNumber || !consignmentId) {
          return res.status(400).json({ message: "Missing phoneNumber or consignmentId" });
      }

      const consignmentStatus = await consignmenthistory.findOne({ consignmentId });

      if (!consignmentStatus) {
          return res.status(404).json({ message: "Consignment does not exist" });
      }

      const steps = [];

      
      const formatDate = (date) => {
          if (!date) return { date: "N/A", time: "N/A", day: "N/A" };
          const d = new Date(date);
          return {
              date: d.toLocaleDateString(),
              time: d.toLocaleTimeString(),
              day: d.toLocaleDateString('en-US', { weekday: 'long' })
          };
      };

     
      const collectedCompleted = consignmentStatus.status === "collected" || 
                                consignmentStatus.status === "In Transit" || 
                                consignmentStatus.status === "Delivered";
      steps.push({
          step: "Consignment Collected",
          completed: collectedCompleted,
          ...(collectedCompleted && consignmentStatus.collected ? 
              { updatedat: formatDate(consignmentStatus.collected) } : 
              { updatedat: { date: "N/A", time: "N/A", day: "N/A" } })
      });

      
      const deliveredCompleted = consignmentStatus.status === "Delivered";
      steps.push({
          step: "Consignment Completed",
          completed: deliveredCompleted,
          ...(deliveredCompleted && consignmentStatus.collected ? 
              { updatedat: formatDate(consignmentStatus.delivered) } : 
              { updatedat: { date: "N/A", time: "N/A", day: "N/A" } })
      });

      return res.status(200).json({ status: steps });

  } catch (error) {
      console.error("Error fetching consignment status:", error.message);
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

const ridestatus= async (req, res) => {
    try {
        const { travelId } = req.query;

        if (!travelId) {
            return res.status(400).json({ message: "Travel ID is required" });
        }

        const travel = await traveldetails.findOne({ travelId });
        if (!travel) {
            return res.status(404).json({ message: "Travel not found" });
        }

        const earn = await earning.findOne({ travelId });

        const statusList = [];

      
        if (travel.status === "Finished" && travel.endedat) {
            statusList.push({
                step: "Ride Completed",
                completed: true,
                updatedat: travel.endedat
            });
        } else {
            statusList.push({
                step: "Ride Completed",
                completed: false
            });
        }

        
        if (earn && earn.status === "inprogress") {
            statusList.push({
                step: "Earning (Transaction) In Progress",
                completed: true,
                updatedat: earn.updatedat || currentime.getCurrentDateTime()
            });
        } else {
            statusList.push({
                step: "Earning (Transaction) In Progress",
                completed: false
            });
        }

       
        if (earn && earn.status === "completed") {
            statusList.push({
                step: "Earning (Transaction) Completed",
                completed: true,
                updatedat: earn.updatedat || currentime.getCurrentDateTime()
            });
        } else {
            statusList.push({
                step: "Earning (Transaction) Completed",
                completed: false
            });
        }

        return res.status(200).json({ status: statusList });

    } catch (error) {
        console.error("Error fetching ride status:", error.message);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};





module.exports = {
    
    pickupconsignment,
    setconsignmetstatus,
    ridestatus,
    setconsignmetstatus ,
    deliver
};
