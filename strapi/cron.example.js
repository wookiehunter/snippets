module.exports = {
	payoutRunOne: {
		task: async ({ strapi }) => {
			try {
				const sites = await strapi.entityService.findMany('api::site.site', {
					populate: '*',
				});
				// console.log("sites", sites[0]);

				const purchasedPublications = await strapi.entityService.findMany(
					'api::purchased-publication.purchased-publication',
					{
						populate: '*',
					},
				);
				// console.log("purchasedPublications", purchasedPublications[6].publication.internal_cost);

				sites.map((site) => {
					const siteDetails = site;

					const createPayout = async (pubIDs, totalPrice, siteDetails) => {
						if (totalPrice > 0) {
							try {
								const newPayout = await strapi.entityService.create(
									'api::payout.payout',
									{
										data: {
											site_name: siteDetails.name,
											site_owner: siteDetails.owner.name,
											site_email: siteDetails.owner.email,
											payout_amount: totalPrice,
											purchased_publications: pubIDs,
										},
									},
								);
								console.log('New Payout: ', newPayout);
							} catch (error) {
								console.log(error);
							}
						}
					};

					if (site.purchased_publications) {
						let publications = site.purchased_publications;

						if (publications.length > 0) {
							let totalPrice = 0;
							let pubIDs = [];
							let intCost;
							let totalIntCost = 0;

							publications.forEach(function (publication) {
								// console.log('publication', publication);
								// console.log("TEST: ", publication.publication);
								let purPudID = publication.id - 1;
								// console.log(`Internal cost for ${publication.id} is ${purchasedPublications[purPudID].publication.internal_cost}`);

								if (
									publication.is_accounting_completed === false &&
									publication.status === 'paid' &&
									publication.payout_created === false
								) {
									pubIDs.push(publication.id);
									totalPrice = totalPrice += publication.price;

									if (
										purchasedPublications[purPudID].publication
											.internal_cost === null
									) {
										intCost = 0;
									} else {
										intCost =
											purchasedPublications[purPudID].publication.internal_cost;
									}
									// console.log("intCost", intCost);
									totalIntCost = totalIntCost += intCost;

									// set payout_created on each Purchased Publication so they don't get included again
									const setPayoutCreated = async () => {
										await strapi.entityService.update(
											'api::purchased-publication.purchased-publication',
											publication.id,
											{
												data: {
													payout_created: true,
												},
											},
										);
									};
									setPayoutCreated();
								} else {
									console.log(`${site.name}: No Payment Due`);
								}
							});
							// console.log("totalIntCost", totalIntCost);

							totalPrice = totalPrice - totalIntCost;
							// console.log("totalPrice", totalPrice);

							createPayout(pubIDs, totalPrice, siteDetails);
						}
					}
				});
			} catch (err) {
				console.log('Error: ', err);
			}
		},
		options: {
			rule: `59 1 1 * * *`,
		},
	},
	InternalPayoutRunOne: {
		task: async ({ strapi }) => {
			try {
				const purchasedPublications = await strapi.entityService.findMany(
					'api::purchased-publication.purchased-publication',
					{
						populate: '*',
					},
				);

				const createInternalPayout = async (pubIDs, totalIntCost) => {
					if (totalIntCost > 0) {
						try {
							const newPayout = await strapi.entityService.create(
								'api::payout.payout',
								{
									data: {
										site_name: 'Internal Payout',
										payout_amount: totalIntCost,
										purchased_publications: pubIDs,
									},
								},
							);
							console.log('New Internal Payout: ', newPayout);
						} catch (error) {
							console.log(error);
						}
					}
				};

				let intCost;
				let totalIntCost = 0;
				let pubIDs = [];

				purchasedPublications.forEach(function (publication) {
					// console.log('publication', publication);
					// console.log("TEST: ", publication.publication);
					let purPudID = publication.id - 1;
					// console.log(`Internal cost for ${publication.id} is ${purchasedPublications[purPudID].publication.internal_cost}`);

					if (
						publication.is_accounting_completed === false &&
						publication.status === 'paid' &&
						publication.payout_created === false
					) {
						pubIDs.push(publication.id);

						if (
							purchasedPublications[purPudID].publication.internal_cost === null
						) {
							intCost = 0;
						} else {
							intCost =
								purchasedPublications[purPudID].publication.internal_cost;
						}
						// console.log("intCost", intCost);
						totalIntCost = totalIntCost += intCost;
					} else {
						console.log(`No Payment Due`);
					}
				});
				// console.log("totalIntCost", totalIntCost);
				// console.log("pubIDs", pubIDs);

				if (totalIntCost > 0) {
					createInternalPayout(pubIDs, totalIntCost);
				}
			} catch (err) {
				console.log('Error: ', err);
			}
		},
		options: {
			rule: `59 0 1 * * *`,
			// rule: `*/15 * * * * *`,
		},
	},
};
