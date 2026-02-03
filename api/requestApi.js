const jwt = require('jsonwebtoken');
require("dotenv").config();
const express = require('express');
const router = express.Router();

// Models
const Plan = require('../models/planModel');
const Subscription = require('../models/subscriptionModel');

// Temporary basic auth check
const simpleAuth = (req, res, next) => {
    console.log("\n=== AUTH MIDDLEWARE ===");
    console.log("Path:", req.path);
    console.log("Method:", req.method);
    
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // Use a FIXED MongoDB-like ID for testing
    req.userId = '123456789012345678901234'; // 24-character fixed ID
    req.userRole = 'user';
    
    console.log("Token provided:", token ? "YES" : "NO");
    console.log("Setting User ID to:", req.userId);
    console.log("Setting User Role to:", req.userRole);
    
    next();
};

// ===================== PLAN ENDPOINTS =====================

// 1. Create Plan
router.post('/plans', async (req, res) => {
    try {
        const { name, price, duration, description, features } = req.body;

        if (!name || !price || !duration) {
            return res.status(400).json({
                success: false,
                message: 'Name, price, and duration are required'
            });
        }

        const plan = new Plan({
            name,
            description: description || '',
            price: Number(price),
            duration: Number(duration),
            features: features || []
        });

        await plan.save();

        res.status(201).json({
            success: true,
            message: 'Plan created',
            data: plan
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// 2. Get All Plans
router.get('/plans', async (req, res) => {
    try {
        const plans = await Plan.find({ isActive: true });
        
        res.json({
            success: true,
            count: plans.length,
            data: plans
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ===================== SUBSCRIPTION ENDPOINTS =====================

// 3. Subscribe to Plan (CRITICAL BUSINESS RULE)
router.post('/subscribe', simpleAuth, async (req, res) => {
    console.log("=== SUBSCRIBE ENDPOINT CALLED ===");
    console.log("Request body:", JSON.stringify(req.body));
    
    try {
        const userId = req.userId; // From simpleAuth
        const { planId } = req.body;

        console.log("User ID:", userId);
        console.log("Plan ID:", planId);

        if (!planId) {
            console.log("ERROR: No planId");
            return res.status(400).json({
                success: false,
                message: 'Plan ID required'
            });
        }

        // Check plan exists
        console.log("Searching for plan...");
        const plan = await Plan.findById(planId);
        console.log("Plan found:", plan ? "YES" : "NO");
        
        if (!plan) {
            console.log("Plan not found error");
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        // CRITICAL BUSINESS RULE: Check for active subscription
        console.log("Checking existing subscriptions...");
        const existingActiveSub = await Subscription.findOne({
            user: userId,
            status: 'active'
        });
        console.log("Existing subscription:", existingActiveSub ? "FOUND" : "NONE");

        if (existingActiveSub) {
            console.log("Business rule violation - already subscribed");
            return res.status(400).json({
                success: false,
                message: 'Already have active subscription. Only one allowed.',
                existing: existingActiveSub
            });
        }

        // Calculate end date
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + plan.duration);
        console.log("Dates - Start:", startDate, "End:", endDate);

        // Create subscription
        console.log("Creating subscription object...");
        const subscription = new Subscription({
            user: userId,
            plan: planId,
            startDate,
            endDate,
            status: 'active'
        });

        console.log("Saving to database...");
        await subscription.save();
        console.log("SUCCESS! Subscription saved with ID:", subscription._id);

        res.status(201).json({
            success: true,
            message: 'Subscribed successfully',
            data: subscription
        });

    } catch (error) {
        console.error('=== SUBSCRIPTION ERROR ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
});

// 4. Get My Subscription
router.get('/my-subscription', simpleAuth, async (req, res) => {
    try {
        const userId = req.userId;

        const subscription = await Subscription.findOne({ user: userId })
            .populate('plan')
            .sort({ createdAt: -1 });

        if (!subscription) {
            return res.json({
                success: true,
                message: 'No subscription found',
                data: null
            });
        }

        res.json({
            success: true,
            data: subscription
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// 5. Cancel Subscription
router.put('/subscription/cancel', simpleAuth, async (req, res) => {
    try {
        const userId = req.userId;

        const subscription = await Subscription.findOneAndUpdate(
            { user: userId, status: 'active' },
            { status: 'cancelled' },
            { new: true }
        );

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'No active subscription found'
            });
        }

        res.json({
            success: true,
            message: 'Subscription cancelled',
            data: subscription
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;