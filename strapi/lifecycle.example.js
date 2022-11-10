module.exports = {
    afterCreate(event) {
      const { result, params } = event;
      // console.log("Results: ", result);
      // console.log("Params: ", params);
  
      const email = result.profile.email;
      const name = result.profile.name;
      // console.log("Email: ", email);
      // console.log("Name: ", name);
  
      const invoiceID = result.id;
      // console.log("Invoice ID: ", invoiceID);
      const profileID = result.profile.id;
      // console.log("Profile ID: ", profileID);
  
      // needs adding to the article lifecycle
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
        // console.log("purPubs: ", purPubs.length);
      };
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
          const updateInvoice = async (invoiceID, purPubsArray, invoiceTotal) => {
            return await strapi.entityService.update(
              "api::invoice.invoice",
              invoiceID,
              {
                data: {
                  purchased_publications: purPubsArray,
                  total: invoiceTotal,
                  email: email,
                  name: name,
                },
              }
            );
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
  
          updateInvoice(invoiceID, purPubsArray, invoiceTotal);
          updatePurchasedPublications(purPubsArray);
        } else {
          console.log("No new publications to invoice");
        }
      });
    },
  };
  