"use strict";

/**
 *  profile controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::invoice.invoice", ({ strapi }) => ({
  async make(ctx, next) {
    const profileID = ctx.params.id;

    // console.log("ProfileID:", profileID);

    const profile = await strapi.entityService.findOne(
      "api::profile.profile",
      profileID
    );
    // console.log("Profile:", profile);
    const email = profile.email;
    const name = profile.name;
    // console.log("Email: ", email);
    // console.log("Name: ", name);

    let purPubs;

    const getPurPubArts = async (profileID) => {
      return ({ purPubs } = await strapi.entityService.findMany(
        "api::purchased-publication.purchased-publication",
        {
          populate: "*",
          filters: {
            profile: { id: profileID },
          },
        }
      ));
      //   console.log("purPubs: ", purPubs.length);
    };

    try {
      getPurPubArts(profileID).then((purPubs) => {
        // console.log("purPubs: ", purPubs);

        let purPubsArray = [];
        let invoiceTotal = 0;

        purPubs.forEach((pub) => {
          if (
            pub.article.status === "completed" &&
            pub.invoice_created !== true
          ) {
            invoiceTotal = +invoiceTotal + pub.price;
            purPubsArray.push(pub.id);
          }
        });
        // console.log("purPubsArray", purPubsArray);
        // console.log("invoiceTotal", invoiceTotal);

        if (purPubsArray.length > 0 && invoiceTotal > 0) {
          const createInvoice = async (purPubsArray, invoiceTotal) => {
            return await strapi.entityService.create("api::invoice.invoice", {
              data: {
                purchased_publications: purPubsArray,
                total: invoiceTotal,
                email: email,
                name: name,
                profile: profileID,
              },
            });
          };

          const updatePurchasedPublications = async (purPubsArray) => {
            purPubsArray.forEach(async (pubID) => {
              return await strapi.entityService.update(
                "api::purchased-publication.purchased-publication",
                pubID,
                {
                  data: {
                    invoice_created: true,
                  },
                }
              );
            });
          };

          createInvoice(purPubsArray, invoiceTotal);
          updatePurchasedPublications(purPubsArray);
        } else {
          console.log("No new publications to invoice");
        }
      });
    } catch (error) {
      console.log("error", error);
    }
    ctx.body = "Your request has been processed.";
  },
}));
