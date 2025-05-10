


module.exports.calculateFare = (weight, distance, travelMode) => {
    let weightFare = 0;
    let distanceFare = 0;
    let TE = 112;
    

    travelMode = travelMode.toLowerCase();

    console.log(`Travel Mode: ${travelMode}`);
    console.log(`Weight: ${weight} kg`);
    console.log(`Distance: ${distance} km`);

    if (travelMode === "train" || travelMode==="car") {
        
        if (weight > 1) {
            weightFare = (weight - 1) * 100;
        }


        if (distance > 0 && distance <= 100) {
            distanceFare = distance * 0.6;
        } else if (distance > 100 && distance <= 500) {
            distanceFare = 60 + (distance - 100) * 0.1;
        } else if (distance > 500) {
            distanceFare = 100 + (distance - 500) * 0.1;
        }
    } else if (travelMode === "airplane") {

        distanceFare = distance * 0.2;
        weightFare = weight * 200;
    } else {
        console.log("Invalid Travel Mode! Please enter 'train' or 'airplane'.");
        return "Error: Invalid Travel Mode";
    }

    console.log(`Weight Fare: ${weightFare} rupees`);
    console.log(`Distance Fare: ${distanceFare} rupees`);


    let totalFare = distanceFare + weightFare;
    console.log(`Total Fare Before Extra Charges: ${totalFare} rupees`);


    let senderTotalPay = (totalFare + TE) * 1.2;
    console.log(`Final Amount (Sender Pays): ${senderTotalPay.toFixed(2)} rupees`);

    return senderTotalPay.toFixed(2);
};
module.exports.calculateFarewithoutweight = (distance, TravelMode) => {
    let distanceFare = 0;
    let TE = 112;
    let deliveryFee = 0;
    let discount = 0;
    let travelMode = TravelMode.toLowerCase();

    console.log(`Travel Mode: ${travelMode}`);
    console.log(`Distance: ${distance} km`);

    if (travelMode === "train" || travelMode === "car") {
        if (distance > 0 && distance <= 100) {
            distanceFare = distance * 0.6;
        } else if (distance > 100 && distance <= 500) {
            distanceFare = 60 + (distance - 100) * 0.1;
        } else if (distance > 500) {
            distanceFare = 100 + (distance - 500) * 0.1;
        }
    } else if (travelMode === "airplane") {
        distanceFare = distance * 0.2;
    } else {
        console.log("Invalid Travel Mode! Please enter 'train', 'car' or 'airplane'.");
        return {
            error: "Invalid Travel Mode"
        };
    }

    console.log(`Distance Fare: ${distanceFare} rupees`);

    // You can apply a discount logic here, for example:
    if (distance > 300) {
        discount = 0.05 * (distanceFare + TE); // 5% discount
        console.log(`Applied Discount: ${discount.toFixed(2)} rupees`);
    }

    let subtotal = distanceFare + TE + deliveryFee;
    let totalWithMargin = (subtotal - discount) * 1.2; // Add 20% margin after discount

    const result = {
        senderTotalPay: totalWithMargin.toFixed(2),
        TE: TE.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        discount: discount.toFixed(2),
        baseFare: distanceFare.toFixed(2)
    };

    console.log("Fare Breakdown:", result);
    return result;
};




// let fair=this.calculateFarewithoutweight(100,"airplane");
// console.log(fair);