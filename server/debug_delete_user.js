require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const run = async () => {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected.");

        const testEmail = "debug_delete_test@example.com";

        // 1. Cleanup previous run
        await User.deleteOne({ email: testEmail });

        // 2. Create User
        console.log("👤 Creating test user...");
        const newUser = new User({
            name: "Debug Delete",
            email: testEmail,
            password: "hashedpassword123",
            isVerified: true
        });
        const savedUser = await newUser.save();
        console.log("✅ User created:", savedUser._id);

        // 3. Simulate Send OTP
        console.log("🔑 Simulating Send OTP...");
        const otp = "123456";
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10m

        savedUser.otp = otp;
        savedUser.otpExpires = otpExpires;
        await savedUser.save();
        console.log("✅ OTP Saved to user.");

        // 4. Verify OTP is in DB
        const userWithOtp = await User.findById(savedUser._id);
        console.log(`🧐 DB Check - OTP: ${userWithOtp.otp}, Expires: ${userWithOtp.otpExpires}`);

        if (userWithOtp.otp !== otp) {
            console.error("❌ CRTICAL: OTP was not saved correctly!");
            return;
        }

        // 5. Simulate Delete Logic (from users.js)
        console.log("🗑️ Simulating Delete Logic...");

        // Input from Request
        const reqBodyOtp = "123456";

        if (!reqBodyOtp || userWithOtp.otp !== reqBodyOtp || userWithOtp.otpExpires < Date.now()) {
            console.error("❌ Delete Failed: Invalid OTP logic trigger");
        } else {
            await User.findByIdAndDelete(savedUser._id);
            console.log("✅ User deleted successfully via logic.");
        }

        // 6. Final Check
        const finalCheck = await User.findById(savedUser._id);
        if (!finalCheck) {
            console.log("🎉 SUCCESS: User is gone.");
        } else {
            console.error("❌ FAILURE: User still exists.");
        }

    } catch (err) {
        console.error("❌ ERROR:", err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
