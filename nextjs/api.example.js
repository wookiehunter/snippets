import axios from "axios";
import { useSession } from "next-auth/react";
import PublicationModel from "./models/publication-model";
class Api {
  constructor() {
    const apiURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";
    const apiClient = axios.create({
      baseURL: `${apiURL}/api`,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    this.apiClient = apiClient;
  }

  setAuthorization = (session) => {
    // calls on each request
    this.apiClient.interceptors.request.use(function (config) {
      const jwt = session.jwt;
      config.headers.Authorization = `Bearer ${jwt}`;

      return config;
    });
  };

  authorizeRequest = async () => {
    let _this = this;
    return axios
      .get(`/api/auth/session`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
      .then(function (session) {
        _this.setAuthorization(session.data);
        return;
      })
      .catch(function (error) {
        console.log({ error });
        throw error;
      });
  };

  auth = {
    signIn: ({ email, password }) => {
      return this.apiClient.post(`/auth/local`, {
        identifier: email,
        password: password,
      });
    },

    signUp: ({ username, email, password }) => {
      return this.apiClient.post(`/auth/local/register`, {
        username: email,
        email: email,
        password: password,
      });
    },
    sendConfirmation: ({ email }) => {
      return this.apiClient.post(`/auth/send-email-confirmation`, {
        email: email,
      });
    },
    forgotPassword: ({ email }) => {
      return this.apiClient.post(`/auth/forgot-password`, { email });
    },
    changePassword: ({
      currentPassword,
      password,
      passwordConfirmation,
      jwt,
    }) => {
      return this.apiClient.post(
        "/auth/change-password",
        {
          currentPassword: currentPassword,
          password: password,
          passwordConfirmation: passwordConfirmation,
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
    },
    resetPassword: ({ password, passwordConfirmation, code }) => {
      return this.apiClient.post(`/auth/reset-password`, {
        password,
        passwordConfirmation,
        code,
      });
    },
  };

  referrals = {
    find: ({ pageNumber = 1, session }) => {
      if (session) {
        this.setAuthorization(session);
      }
      let _this = this;

      let profile_id = session?.profile?.id;
      let filters = {};

      filters.referrer = {
        id: {
          $eq: profile_id,
        },
      };

      const qs = require("qs");
      const query = qs.stringify(
        {
          filters,
          sort: ["createdAt:desc"],
          pagination: {
            page: pageNumber,
            pageSize: 10,
          },
          populate: {
            profile: {
              populate: true,
            },
          },
        },
        {
          encodeValuesOnly: true,
        }
      );

      return _this.apiClient.get(`/referrals?${query}`);
    },
    create: ({ profile_id, referrer_id, session }) => {
      if (session) {
        this.setAuthorization(session);
      }
      return this.apiClient.post(`/referrals`, {
        data: {
          profile: profile_id,
          profile_id: profile_id,
          referrer: referrer_id,
          ref_id: referrer_id,
          is_affiliate: true, //TODO: make this dynamic for non-affiliate referrals
          signup_date: new Date(),
        },
      });
    },
  };

  publications = {
    find: ({
      pageNumber = 1,
      searchQuery = "",
      category = null,
      sort = ["popularity_rank:desc"],
      is_featured = false,
      pageSize = 10,
    }) => {
      const qs = require("qs");
      const filters = {};
      if (searchQuery && searchQuery.length > 0) {
        filters.name = {
          $containsi: searchQuery,
        };
      }
      if (is_featured == true) {
        filters.is_featured = {
          $eq: is_featured,
        };
      }
      if (category) {
        filters.publication_categories = {
          name: {
            $in: category,
          },
        };
      }
      const query = qs.stringify(
        {
          pagination: {
            page: pageNumber,
            pageSize,
          },
          sort: sort,
          filters,
          populate: {
            publication_categories: {
              populate: true,
            },
            logo: {
              populate: true,
            },
          },
        },
        {
          encodeValuesOnly: false,
        }
      );

      // return this.apiClient.get(`/publications?${query}&populate[logo][populate]=*`)
      return this.apiClient.get(`/publications?${query}`);
    },
  };

  publication_categories = {
    find: () => {
      const qs = require("qs");

      const query = qs.stringify(
        {
          pagination: {
            page: 1,
            pageSize: 100,
          },
        },
        {
          encodeValuesOnly: false,
        }
      );

      return this.apiClient.get(`/publication-categories?${query}`);
    },
  };

  orders = {
    create: (data, session) => {
      if (session) {
        this.setAuthorization(session);
      }
      return this.apiClient.post(`/orders`, data);
    },
    invoice: (data, session) => {
      if (session) {
        this.setAuthorization(session);
      }
      return this.apiClient.post(`/invoice-checkout`, data);
    },
    find: ({ pageNumber = 1, session }) => {
      if (session) {
        this.setAuthorization(session);
      }
      let _this = this;

      let profile_id = session?.profile?.id;
      let filters = {
        status: {
          $eq: "paid",
        },
      };

      filters.profile = {
        id: {
          $eq: profile_id,
        },
      };

      const qs = require("qs");
      const query = qs.stringify(
        {
          filters,
          sort: ["createdAt:desc"],
          pagination: {
            page: pageNumber,
            pageSize: 10,
          },
          populate: {
            profile: {
              populate: true,
            },
          },
        },
        {
          encodeValuesOnly: true,
        }
      );

      return _this.apiClient.get(`/orders?${query}`);
    },
    getSiteOrders: ({ pageNumber = 1, session, site_id }) => {
      if (session) {
        this.setAuthorization(session);
      }
      let _this = this;
      let filters = {
        site: {
          id: {
            $eq: site_id,
          },
        },
      };

      const qs = require("qs");
      const query = qs.stringify(
        {
          filters,
          sort: ["createdAt:desc"],
          pagination: {
            page: pageNumber,
            pageSize: 10,
          },
          populate: {
            profile: {
              populate: true,
            },
          },
        },
        {
          encodeValuesOnly: true,
        }
      );

      return _this.apiClient.get(`/orders?${query}`);
    },
    getAbandonedOrders: ({ pageNumber = 1, session }) => {
      if (session) {
        this.setAuthorization(session);
      }
      let _this = this;

      let filters = {
        status: {
          $eq: "created",
        },
      };

      const qs = require("qs");
      const query = qs.stringify(
        {
          filters,
          sort: ["createdAt:desc"],
          pagination: {
            page: pageNumber,
            pageSize: 10,
          },
          populate: {
            profile: {
              populate: true,
            },
          },
        },
        {
          encodeValuesOnly: true,
        }
      );

      return _this.apiClient.get(`/orders?${query}`);
    },
  };

  publicationInquiries = {
    create: async ({ data }) => {
      await this.authorizeRequest();
      return this.apiClient.post(`/publication-inquiries`, { data });
    },
  };

  credits = {
    calcTotal: ({ session }) => {
      if (session) {
        this.setAuthorization(session);
      }
      let _this = this;
      let profile_id = session?.profile?.id;

      return _this.apiClient.get(`profile/${profile_id}/credits/total`);
    },
  };
  invoices = {
    make: ({ session, data }) => {
      if (session) {
        this.setAuthorization(session);
      }
      let _this = this;
      let profile_id = data.profile_id;

      return _this.apiClient.post(`invoice/make/${profile_id}`, { data });
    },
  };
  site_publications = {
    find: ({
      pageNumber = 1,
      searchQuery = "",
      publicationFilters = {},
      category = null,
      sort = ["publication.popularity_rank:desc"],
      is_featured = false,
      pageSize = 100,
      site_id,
      session,
      is_whitelabel_owner = false,
      showHidden = false,
      showBasePrices = false,
    }) => {
      if (session) {
        this.setAuthorization(session);
      }
      const qs = require("qs");

      const filters = {
        site: {
          id: {
            $eq: site_id,
          },
        },
        publication: publicationFilters,
      };
      if (!showHidden) {
        filters.is_hidden = {
          $eq: false,
        };
      }
      if (is_featured == true) {
        filters.is_featured = {
          $eq: is_featured,
        };
      }
      if (searchQuery && searchQuery.length > 0) {
        filters.publication = {
          name: {
            $containsi: searchQuery,
          },
        };
      }

      if (category) {
        filters.publication = {
          ...filters.publication,
          publication_categories: {
            name: {
              $in: category,
            },
          },
        };
      }
      let populationPopulate = ["publication_categories", "logo"];
      if (is_featured) {
        populationPopulate.push("word_logo");
      }
      const query = qs.stringify(
        {
          pagination: {
            page: pageNumber,
            pageSize,
          },
          sort: sort,
          filters,
          populate: {
            publication: {
              populate: populationPopulate,
            },
          },
        },
        {
          encodeValuesOnly: false,
        }
      );

      // return this.apiClient.get(`/publications?${query}&populate[logo][populate]=*`)
      return this.apiClient.get(`/site-publications?${query}`).then((res) => {
        const site_publications = res.data.data;
        const paginationData = res.data.meta.pagination;

        const site_publications_formatted = site_publications.reduce(
          (result, item) => {
            let publication = item.attributes.publication.data;
            // check if publication exists becuase hidden publications do not return a publication
            if (publication) {
              let sitePublication = new PublicationModel(publication);

              if (is_whitelabel_owner) {
                sitePublication.id = item.id; // override the publication id with the site publication id
              }
              sitePublication.isFeatured = item.attributes.is_featured;
              if (!showBasePrices) {
                // if not showing base prices, then use the site publication price
                let override_price = item.attributes.price;
                sitePublication.price = override_price;
              }
              sitePublication.isHidden = item.attributes.is_hidden;
              result.push(sitePublication);
            }

            return result;
          },
          []
        );

        return {
          data: site_publications_formatted,
          pagination: paginationData,
        };
      });
    },

    update: ({ id, data, session }) => {
      if (session) {
        this.setAuthorization(session);
      }
      return this.apiClient.put(`/site-publications/${id}`, { data: data });
    },

    save: (data, session) => {
      if (session) {
        this.setAuthorization(session);
      }
      return this.apiClient.post(`/site-publications`, data);
    },
  };

  sites = {
    get: ({ session, subdomain, customDomain, profile_id }) => {
      if (session) {
        this.setAuthorization(session);
      }

      const qs = require("qs");
      let filters = {
        is_live: {
          $eq: true,
        },
      };
      if (subdomain) {
        filters.subdomain = {
          $eq: subdomain,
        };
      } else if (customDomain) {
        filters.customDomain = {
          $eq: customDomain,
        };
      } else if (profile_id) {
        filters.owner = {
          id: {
            $eq: profile_id,
          },
        };
      } else {
        return null;
      }

      const query = qs.stringify(
        {
          populate: {
            logo: {
              populate: true,
            },
            ogImage: {
              populate: true,
            },
            favicon: {
              populate: true,
            },
            site_publication_categories: {
              populate: true,
            },
          },
          filters,
        },
        {
          encodeValuesOnly: true,
        }
      );

      return this.apiClient
        .get(`/sites?${query}`)
        .then((res) => {
          let siteData = res.data?.data;
          if (siteData.length > 0) {
            return siteData[0];
          } else {
            return null;
          }
        })
        .catch((err) => {
          console.log(err);
          return null;
        });
    },
    find: ({ session }) => {
      if (session) {
        this.setAuthorization(session);
      }
      const qs = require("qs");

      const query = qs.stringify(
        {
          filters: {
            is_live: {
              $eq: true,
            },
          },
        },
        {
          encodeValuesOnly: false,
        }
      );

      return this.apiClient.get(`/sites?${query}`);
    },
    update: ({ session, id, data }) => {
      if (session) {
        this.setAuthorization(session);
      }

      return this.apiClient.put(`/sites/${id}`, { data: data });
    },
  };

  users = {
    get: (session) => {
      if (session) {
        this.setAuthorization(session);
      }

      const qs = require("qs");
      const query = qs.stringify(
        {
          populate: {
            profile: {
              populate: ["w9"],
            },
            role: {
              populate: true,
            },
          },
        },
        {
          encodeValuesOnly: true,
        }
      );

      return this.apiClient.get(`/users/${session.id}?${query}`);
    },
    update: ({ session, data }) => {
      // console.log('Update Receives: ', session, newPassword);
      if (session) {
        this.setAuthorization(session);
      }

      return this.apiClient.put(`/users/${session.id}`, data);
    },
  };

  coupons = {
    get: (id) => {
      return this.apiClient.get(`/coupons/${id}`);
    },
  };

  profiles = {
    get: (session) => {
      if (session) {
        this.setAuthorization(session);
      }
      return this.apiClient.get("/profile");
    },
    findSiteProfiles: ({ site_id, session, pageNumber = 1 }) => {
      if (session) {
        this.setAuthorization(session);
      }
      const qs = require("qs");
      const query = qs.stringify({
        filters: {
          site: {
            id: {
              $eq: site_id,
            },
          },
        },
        sort: ["createdAt:desc"],
        pagination: {
          page: pageNumber,
          pageSize: 10,
        },
        populate: {
          orders: {
            filters: {
              status: {
                $eq: "paid",
              },
            },
          },
        },
      });
      return this.apiClient.get(`/profiles?${query}`);
    },
    findAllProfiles: ({ session, pageNumber = 1 }) => {
      if (session) {
        this.setAuthorization(session);
      }
      const qs = require("qs");
      const query = qs.stringify({
        filters: {},
        sort: ["createdAt:desc"],
        pagination: {
          page: pageNumber,
          pageSize: 10,
        },
        populate: {
          site: {
            populate: true,
          },
          orders: {
            filters: {
              status: {
                $eq: "paid",
              },
            },
          },
        },
      });
      return this.apiClient.get(`/profiles?${query}`);
    },
    create: (data, session) => {
      console.log("Create:Data: ", data);
      if (session) {
        this.setAuthorization(session);
      }
      let _this = this;
      return this.apiClient
        .post("/profiles", data)
        .then(function (profileResult) {
          // return _this.apiClient.put(`/users/${session.id}`, {profile:profileResult.data?.data?.id}).then(function(userResult) {
          return profileResult;
          // })
        });
    },
    update: ({ data, session }) => {
      if (session) {
        this.setAuthorization(session);
      }
      let _this = this;
      return this.apiClient
        .put(`/profiles/${session.profile.id}`, { data: data })
        .then(function (profileResult) {
          // return _this.apiClient.put(`/users/${session.id}`, {profile:profileResult.data?.data?.id}).then(function(userResult) {
          return profileResult;
          // })
        });
    },
    findOne: ({ id, session }) => {
      if (session) {
        this.setAuthorization(session);
      }
      console.log("ID", id);
      return this.apiClient.get(`/profiles/${id}`);
    },
  };

  uploads = {
    create: ({ data, session }) => {
      if (session) {
        this.setAuthorization(session);
      }
      // console.log('Upload:', data);
      return this.apiClient.post("/upload", data);
    },
    find: (session) => {
      if (session) {
        this.setAuthorization(session);
      }
      return this.apiClient.get("/upload/files");
    },
    delete: ({ id, session }) => {
      // console.log('Passed ID: ', id);
      if (session) {
        this.setAuthorization(session);
      }
      return this.apiClient.delete(`/upload/files/${id}`);
    },
  };

  purchasedPublications = {
    //TODO: refactor this to backend (too long and complicated - easily breakable)
    find: ({
      pageNumber = 1,
      session,
      status = null,
      only_show_unused = false,
      pageSize = 10,
      site_id = null,
    }) => {
      if (session) {
        this.setAuthorization(session);
      }
      let _this = this;

      let profile_id = session?.profile?.id;
      let filters = {};
      if (
        session.role !== "Manager" &&
        !session.profile.is_whitelabel &&
        !session.profile.is_affiliate
      ) {
        filters.profile = {
          id: {
            $eq: profile_id,
          },
        };
      }
      if (session.profile.is_affiliate) {
        filters.ref_id = {
          $eq: session.profile.id,
        };
      }
      if (site_id) {
        filters.site = {
          id: {
            $eq: site_id,
          },
        };
      }
      if (status) {
        filters.article = {
          status: {
            $eq: status,
          },
        };
      }

      if (only_show_unused == true) {
        filters.article = {
          id: { $null: true },
        };
      }

      const qs = require("qs");
      const query = qs.stringify(
        {
          filters,
          sort: ["updatedAt:desc"],
          pagination: {
            page: pageNumber,
            pageSize: pageSize,
          },
          populate: {
            profile: {
              populate: true,
            },
            publication: {
              populate: true,
            },
            article: {
              populate: ["campaign", "drafts"],
            },
          },
        },
        {
          encodeValuesOnly: true,
        }
      );

      return _this.apiClient.get(`/purchased-publications?${query}`);
    },
    getAll: (session) => {
      if (session) {
        this.setAuthorization(session);
      }

      const qs = require("qs");
      const query = qs.stringify(
        {
          populate: {
            publication: {
              populate: true,
            },
            article: {
              populate: ["campaign"],
            },
          },
        },
        {
          encodeValuesOnly: true,
        }
      );

      return this.apiClient.get(`/purchased-publications?${query}`);
    },
  };
  
  legal = {
    terms: () => {
      return this.apiClient.get("/terms-of-service");
    },
    privacy: () => {
      return this.apiClient.get("/privacy-policy");
    },
  };
  campaigns = {
    update: (id, data, session) => {
      if (session) {
        this.setAuthorization(session);
      }

      return this.apiClient
        .put(`/campaigns/${id}`, {
          data: data,
        })
        .then((response) => {
          //after success
          return response;
        })
        .catch((error) => {
          //handle error
          console.log(error);
        });
    },
    findOne: (id, session) => {
      if (session) {
        this.setAuthorization(session);
      }
      const qs = require("qs");
      const query = qs.stringify(
        {
          populate: {
            articles: {
              populate: [
                "purchased_publication",
                "purchased_publication.publication",
                "drafts",
              ],
            },
            questionnaire: {
              populate: true,
            },
            images: {
              populate: true,
            },
            profile: {
              populate: true,
            },
          },
        },
        {
          encodeValuesOnly: true,
        }
      );
      return this.apiClient.get(`/campaigns/${id}?${query}`);
    },
    find: (session) => {
      if (session) {
        this.setAuthorization(session);
      }

      const role = session.role;
      let filters = {};

      if (role !== "Manager") {
        const profile_id = session.profile?.id;
        filters.profile = {
          id: {
            $eq: profile_id,
          },
        };
      }

      const qs = require("qs");
      const query = qs.stringify(
        {
          filters: filters,
          sort: ["updatedAt:desc"],
          populate: {
            articles: {
              populate: true,
            },
            profile: {
              populate: true,
            },
            images: {
              count: true,
            },
          },
        },
        {
          encodeValuesOnly: true,
        }
      );

      return this.apiClient.get(`/campaigns?${query}`);
    },
    create: (data, session) => {
      if (session) {
        this.setAuthorization(session);
      }
      return this.apiClient.post("/campaigns", data);
    },
    uploadFiles: (data, session) => {
      if (session) {
        this.setAuthorization(session);
      }
      return this.apiClient
        .post("/upload", data)
        .then((response) => {
          //after success
          console.log("upload response", response);
          return response;
        })
        .catch((error) => {
          //handle error
          console.log(error);
        });
    },
    deleteImage: (id, session) => {
      if (session) {
        this.setAuthorization(session);
      }
      return this.apiClient.delete(`/upload/files/${id}`);
    },
    delete: (id, session) => {
      if (session) {
        this.setAuthorization(session);
      }
      return this.apiClient.delete(`/campaigns/${id}`);
    },
  };

  messages = {
    create: (data, session) => {
      if (session) {
        this.setAuthorization(session);
      }
      return this.apiClient.post("/messages", { data: data });
    },
    getAllClientMessages: (session) => {
      if (session) {
        this.setAuthorization(session);
      }
      const qs = require("qs");
      const filters = {
        is_from_client: {
          $eq: true,
        },
      };

      const query = qs.stringify(
        {
          populate: ["profile", "campaign", "article"],
          filters,
        },
        {
          encodeValuesOnly: false,
        }
      );

      return this.apiClient.get(`/messages?${query}`);
    },
    getMessagesForCampaignsForClient: (campaignIds, session) => {
      if (session) {
        this.setAuthorization(session);
      }
      const qs = require("qs");
      const filters = {
        campaign: {
          id: {
            $in: campaignIds,
          },
        },
        is_from_client: {
          $eq: false,
        },
      };

      const query = qs.stringify(
        {
          populate: ["profile", "campaign", "article"],
          filters,
        },
        {
          encodeValuesOnly: false,
        }
      );

      return this.apiClient.get(`/messages?${query}`);
    },
    getMessagesForCampaignsForManager: (campaignIds, session) => {
      if (session) {
        this.setAuthorization(session);
      }
      const qs = require("qs");
      const filters = {
        campaign: {
          id: {
            $in: campaignIds,
          },
        },
        is_from_client: {
          $eq: true,
        },
      };

      const query = qs.stringify(
        {
          populate: ["profile", "campaign", "article"],
          filters,
        },
        {
          encodeValuesOnly: false,
        }
      );

      return this.apiClient.get(`/messages?${query}`);
    },
    getMessagesForArticle: (article_id, session) => {
      if (session) {
        this.setAuthorization(session);
      }
      const qs = require("qs");
      const filters = {
        article: {
          id: {
            $eq: article_id,
          },
        },
      };

      const query = qs.stringify(
        {
          filters,
        },
        {
          encodeValuesOnly: false,
        }
      );

      return this.apiClient.get(`/messages?${query}&populate[profile]=*`);
    },
  };

  articles = {
    setup: (data, session) => {
      if (session) {
        this.setAuthorization(session);
      }
      const campaignId = data.campaignId;

      return this.apiClient
        .post(`/articles`, {
          data: {
            status: "reviewing",
            purchased_publication: data.purchased_publication,
            campaign: campaignId,
            is_written_by_user: false,
          },
        })
        .then((statusResponse) => {
          //after success
          return statusResponse;
        })
        .catch((error) => {
          //handle error
          console.log(error);
          return null;
        });
    },
    upload: (data, session) => {
      if (session) {
        this.setAuthorization(session);
      }
      const article = data.article;
      const campaignId = data.campaignId;

      return this.apiClient
        .post(`/articles`, {
          data: {
            status: "reviewing",
            purchased_publication: article.purchased_publication,
            campaign: campaignId,
            is_written_by_user: true,
            name: article.name,
            approved_for_publishing: data.approved_for_publishing,
          },
        })
        .then((statusResponse) => {
          //after success
          const articleData = statusResponse?.data?.data;

          const articleId = articleData?.id;

          const formData = new FormData();

          formData.append("files", article.file);
          formData.append("ref", "api::article.article");
          formData.append("field", "drafts");
          formData.append("refId", articleId);

          const upload = this.apiClient.post("/upload", formData);

          return upload;
        })
        .catch((error) => {
          //handle error
          console.log(error);
          return null;
        });
    },
    revise: (data, session) => {
      if (session) {
        this.setAuthorization(session);
      }
      const formData = data.formData;
      const id = data.id;

      if (data.formData) {
        const upload = this.apiClient.post("/upload", formData);
      }

      return this.apiClient
        .put(`/articles/${id}`, { data: data })
        .then((statusResponse) => {
          //after success
          return statusResponse;
        })
        .catch((error) => {
          //handle error
          console.log(error);
        });
    },
    update: (id, session, data) => {
      if (session) {
        this.setAuthorization(session);
      }
      return this.apiClient
        .put(`/articles/${id}`, { data: data })
        .then((response) => {
          //after success
          return response;
        })
        .catch((error) => {
          //handle error
          console.log(error);
        });
    },
  };

  invoice = {
    findOne: ({ id, session }) => {
      if (session) {
        this.setAuthorization(session);
      }
      console.log("ID", id);
      return this.apiClient.get(`/invoices/${id}`);
    },
  };
}

export default new Api();
