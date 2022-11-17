"use strict";

const coupon = require("../../payment/routes/coupon");

/**
 *  order controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  // Method 2: Wrapping a core action (leaves core logic in place)
  async create(ctx) {
    const { items, coupon, processing_fee, total, site } =
      ctx.request.body.data;

    const user = await strapi.entityService.findOne(
      "plugin::users-permissions.user",
      ctx.state.user.id,
      {
        populate: ["profile", "profile.referral_received"],
      }
    );

    let redirect_url;
    let site_name = "";
    let site_url = "";

    if (site) {
      const site_id = site; //for clarification

      const siteData = await strapi.entityService.findOne(
        "api::site.site",
        site_id
      );
      site_name = siteData.name;
      site_url = siteData.customDomain;
      redirect_url = siteData.customDomain
        ? `https://${siteData.customDomain}`
        : `https://${siteData.subdomain}.pressbackend.com`;
    } else {
      //handle for existing waverlypress.com site before migration
      redirect_url = `https://waverlypress.com`;
    }

    const discounts = [];
    if (coupon) {
      discounts.push({ coupon: coupon.id });
    }

    const line_items = items.map((item) => {
      const price_data = {
        currency: "usd",
        unit_amount: item.price * 100, // Stripe expects prices in cents
        product_data: {
          name: item.name,
          description: item.description,
          metadata: {
            publication_id: item.id,
          },
        },
      };
      return { price_data, quantity: item.quantity };
    });
    const profile_id = user.profile.id;
    // Calling the default core action
    const referral = user.profile.referral_received;
    let stripe_customer_id = user.profile.stripe_customer_id;
    ctx.request.body.data.items = line_items;
    ctx.request.body.data.profile = profile_id;
    ctx.request.body.data.email = user.profile.email;
    if (referral) {
      ctx.request.body.data.ref_id = referral.ref_id;
    }
    const { data, meta } = await super.create(ctx);
    const processingFeeAmount = processing_fee * 100;

    line_items.push({
      price_data: {
        currency: "usd",
        unit_amount: Math.round(processingFeeAmount),
        product_data: {
          name: "Processing Fee",
          description: "3%",
          metadata: { publication_id: "processing_fee" },
        },
      },
      quantity: 1,
    });

    if (!site) {
      //STRIPE CHECKOUT PAGE
      //handle for existing waverlypress.com site before migration
      const session = await stripe.checkout.sessions.create({
        metadata: {
          order_id: data.id,
          profile_id: profile_id,
        },
        line_items,
        discounts,
        mode: "payment",
        success_url: `${redirect_url}/campaigns/new`,
        cancel_url: `${redirect_url}/publications`,
      });

      return { data, session };
    }

    let creditTotal = await strapi
      .service("api::credit.credit")
      .calcTotal(profile_id);

    if (creditTotal >= total) {
      //use credits
      const credit = await strapi.service("api::credit.credit").create({
        data: {
          profile: profile_id,
          amount: total,
          type: "debit",
        },
      });

      let order = await strapi.service("api::order.order").update(data.id, {
        data: {
          status: "paid",
          date_paid: new Date(),
        },
      });
      return { order };
    } else {
      if (!stripe_customer_id) {
        //create stripe customer if none exists
        const customer = await stripe.customers
          .create({
            description: `${user.profile.name}`,
            email: user.profile.email,
            name: user.profile.name,
            metadata: {
              profile_id: profile_id,
            },
          })
          .catch((err) => {
            console.log("error creating stripe customer", err);
          });

        stripe_customer_id = customer.id;
        await strapi
          .service("api::profile.profile")
          .update(profile_id, { data: { stripe_customer_id: customer.id } });
      }

      const roundedTotalInCents = Math.round(total * 100);
      //Custom STRIPE Checkout flow
      let statement_descriptor = `${site_name}`;
      if (statement_descriptor.length > 22) {
        statement_descriptor = statement_descriptor.substring(0, 22); //max 22 characters
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: roundedTotalInCents, // Stripe expects prices in cents
        currency: "usd",
        statement_descriptor: statement_descriptor,
        customer: stripe_customer_id,
        metadata: {
          order_id: data.id,
          profile_id: profile_id,
        },
        //TODO: create different payment intents based off ACH or Credit Card
        // payment_method_types: ['card']
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return { data, client_secret: paymentIntent.client_secret };
    }
  },
  async invoice(ctx) {
    const { items, total, processing_fee, site, profile } =
      ctx.request.body.data;

    let redirect_url;
    let site_name = "";
    let site_url = "";

    if (site) {
      const siteData = await strapi.entityService.findOne(
        "api::site.site",
        site.id
      );
      site_name = siteData.name;
      site_url = siteData.customDomain;
      redirect_url = siteData.customDomain
        ? `https://${siteData.customDomain}`
        : `https://${siteData.subdomain}.pressbackend.com`;
    } else {
      //handle for existing waverlypress.com site before migration
      redirect_url = `https://waverlypress.com`;
    }

    const line_items = items.map((item) => {
      const price_data = {
        currency: "usd",
        unit_amount: item.pur_pub_price * 100, // Stripe expects prices in cents
        product_data: {
          name: item.art_name,
          metadata: {
            publication_id: item.art_id,
          },
        },
      };
      return { price_data, quantity: 1 };
    });
    const profile_id = profile.id;
    // Calling the default core action
    const referral = profile.referral_received;
    let stripe_customer_id = profile.stripe_customer_id;
    ctx.request.body.data.items = line_items;
    ctx.request.body.data.profile = profile_id;
    ctx.request.body.data.email = profile.email;
    if (referral) {
      ctx.request.body.data.ref_id = referral.ref_id;
    }
    const { data, meta } = await super.create(ctx);
    const processingFeeAmount = processing_fee * 100;

    line_items.push({
      price_data: {
        currency: "usd",
        unit_amount: Math.round(processingFeeAmount),
        product_data: {
          name: "Processing Fee",
          description: "3%",
          metadata: { publication_id: "processing_fee" },
        },
      },
      quantity: 1,
    });

    if (!site) {
      //STRIPE CHECKOUT PAGE
      //handle for existing waverlypress.com site before migration
      const session = await stripe.checkout.sessions.create({
        metadata: {
          order_id: data.id,
          profile_id: profile_id,
        },
        line_items,
        discounts,
        mode: "payment",
        success_url: `${redirect_url}/campaigns/new`,
        cancel_url: `${redirect_url}/publications`,
      });

      return { data, session };
    }
    if (!stripe_customer_id) {
      //create stripe customer if none exists
      const customer = await stripe.customers
        .create({
          description: `${profile.name}`,
          email: profile.email,
          name: profile.name,
          metadata: {
            profile_id: profile_id,
          },
        })
        .catch((err) => {
          console.log("error creating stripe customer", err);
        });

      stripe_customer_id = customer.id;
      await strapi
        .service("api::profile.profile")
        .update(profile_id, { data: { stripe_customer_id: customer.id } });
    }

    const roundedTotalInCents = Math.round(total * 100);
    //Custom STRIPE Checkout flow
    let statement_descriptor = `${site_name}`;
    if (statement_descriptor.length > 22) {
      statement_descriptor = statement_descriptor.substring(0, 22); //max 22 characters
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: roundedTotalInCents, // Stripe expects prices in cents
      currency: "usd",
      statement_descriptor: statement_descriptor,
      customer: stripe_customer_id,
      metadata: {
        order_id: data.id,
        profile_id: profile_id,
      },
      //TODO: create different payment intents based off ACH or Credit Card
      // payment_method_types: ['card']
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return { data, client_secret: paymentIntent.client_secret };
  },
}));
