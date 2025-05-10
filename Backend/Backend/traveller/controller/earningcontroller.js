
const User = require('../../user/model/User');
const Earning = require("../../traveller/model/Earning"); // adjust path if needed
// adjust the path to your model

module.exports.getEarnings = async (req, res) => {
    try {
        let { travelId } = req.query;

        // Decode phoneNumber to handle encoded "+" (e.g., %2B91892...)
        // phoneNumber = decodeURIComponent(phoneNumber || "").trim();
        // if (!phoneNumber.startsWith("+")) {
        //     phoneNumber = `+${phoneNumber}`;
        // }

        // console.log("Decoded Phone Number:", phoneNumber);

        if (!travelId) {
            return res.status(400).json({
                status: "error",
                message: "Phone number is required"
            });
        }

        // Find the earning entry by exact phone number
        const earningData = await Earning.findOne({ travelId });

        if (!earningData) {
            return res.status(200).json({
                status: "success",
                totalEarnings: 0,
                message: "No earnings till now",
                data: []
            });
        }

        // Normalize status comparison to ignore casing or extra spaces
        const completedTransactions = earningData.transactions.filter(
            transaction => transaction.status?.trim().toLowerCase() === "completed"
        );

        const totalEarnings = completedTransactions.reduce(
            (sum, transaction) => sum + transaction.amount,
            0
        );

        return res.status(200).json({
            status: "success",
            totalEarnings,
            data: completedTransactions.map(transaction => ({
                date: transaction.timestamp.toISOString().split("T")[0],
                amount: transaction.amount,
                paymentId: transaction.paymentId,
                title: transaction.title,
                travelId: transaction.travelId,
                status: transaction.status,
                method: transaction.paymentMethod
            }))
        });

    } catch (error) {
        console.error("Error fetching earnings:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: error.message
        });
    }
};

