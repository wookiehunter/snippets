import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getSession, useSession, signIn, signOut } from "next-auth/react";
import {
  LockClosedIcon,
  ArrowNarrowLeftIcon,
  ArrowNarrowRightIcon,
} from "@heroicons/react/solid";
import { useRef } from "react";
import Navbar from "@/components/navbar";
import ScrollableTabs from "@/components/scrollableTabs";
import API from "@/lib/api";
import StatusLabel from "@/components/statusLabel";
import moment from "moment";
import DateHandler from "@/lib/date-handler";
import StatusHandler from "@/lib/status-handler";
import classNames from "classnames";
import PurchasedPublicationModel from "@/lib/models/purchased-publication-model";
import CustomerPurchasedPublicationsTable from "@/components/dashboard/customerPurchasedPublication";
import ProfileModel from "@/lib/models/profile-model";

const Customer = ({ role, site }) => {
  // console.log('Passed ID', ID);
  const router = useRouter();
  const { data: session } = useSession();
  // console.log('session', session);
  const [paginationData, setPaginationData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const pageNumberRef = useRef(1);
  const [purchasedPublications, setPurchasedPublications] = useState([]);

  const [profile, setProfile] = useState({});

  const tabs = [
    {
      name: "all",
      value: null,
    },
    {
      name: "action required",
      value: "reviewing",
    },
    {
      name: "reviewing",
      value: "action-required",
    },
    {
      name: "publishing",
      value: "publishing",
    },
    {
      name: "completed",
      value: "completed",
    },
  ];
  const [selectedTab, setSelectedTab] = useState(tabs[0]);

  const fetchProfileInfo = async (profileID, session) => {
    // const ID = profileID;
    // console.log('fetchProfileInfo', ID, session);
    const response = await API.profiles
      .findOne({
        id: profileID,
        session: session,
      })
      .then((response) => {
        const profile = new ProfileModel(response.data.data);
        setProfile(profile);
      })
      .catch((error) => {
        console.log("error", error);
      });

    return;
  };

  const fetchPurchasedPublications = async (profileID) => {
    setIsLoading(true);
    // console.log('Fetch ID: ', ID);

    const response = await API.purchasedPublications
      .find({
        pageNumber: pageNumberRef.current,
        status: selectedTab.value,
        session,
        site_id: site ? site.id : null,
      })
      .then(function (result) {
        let purchasedPublicationModels = result.data.data.map(
          (purchasedPublication) => {
            return new PurchasedPublicationModel(purchasedPublication);
          }
        );
        // let sortByArticleLastUpdated = purchasedPublicationModels.sort(
        //     (a, b) => {
        //     return new Date(b.getLastUpdate()) - new Date(a.getLastUpdate());
        //     }
        // );
        let filterByProfileID = purchasedPublicationModels.filter(
          (purchasedPublication) => {
            return purchasedPublication?.profile?.id == profileID;
          }
        );

        // console.log('Sorted: ', filterByProfileID);

        setPurchasedPublications(filterByProfileID);
        setPaginationData(result.data.meta.pagination);
        setIsLoading(false);
      });
  };

  const nextPage = () => {
    pageNumberRef.current += 1;
    fetchPurchasedPublications();
  };

  const prevPage = () => {
    pageNumberRef.current -= 1;
    fetchPurchasedPublications();
  };

  const handleSendInvoice = async (purchasedPublication) => {
    // console.log('handleSendInvoice', purchasedPublication);
    console.log({ profile });
    const response = await API.invoices
      .make({
        data: { profile_id: profile.id },
      })
      .then((response) => {
        console.log("response", response);
      });
  };

  useEffect(() => {
    if (session && router.query.id) {
      const profileID = router.query.id;
      pageNumberRef.current = 1;
      setPurchasedPublications([]);
      fetchPurchasedPublications(profileID);
      fetchProfileInfo(profileID, session);
    }
  }, [session, selectedTab, router.query.id]);

  // console.log('purchasedPublications', purchasedPublications);

  const isManager = role === "Manager";
  // const isManager = true;

  return (
    <>
      <Navbar isManager={true} />
      <div className="min-h-full py-12 px-4 sm:px-6 lg:px-8 h-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-16 mt-6 ">
          <h1 className="text-xl md:text-4xl">{profile.name}</h1>
          <div id="ProfileDetails" className="space-y-2 grid grid-cols-3">
            <div className="">
              <div className="text-gray-500 text-lg">Email</div>
              <div className="text-lg">
                {profile.email}{" "}
                <a href={`mailto:${profile.email}`}>
                  <button type="button" className="button">
                    Send Email
                  </button>
                </a>
              </div>
              <button
                type="button"
                className="button"
                onClick={handleSendInvoice}
              >
                Invoice Unpaid Publications
              </button>
            </div>
            <div className="">
              <div className="basis-1/3 text-gray-500 text-lg">Signed up</div>
              <div className="basis-2/3 text-lg">
                {moment(profile.createdAt).format("MMMM Do YYYY")}
              </div>
            </div>
            <div className="">
              <div className="basis-1/3 text-gray-500 text-lg">
                Profile Type
              </div>
              <div className="basis-2/3 text-lg">
                {profile.companyType?.toUpperCase()}
              </div>
            </div>
            {profile.address1 && (
              <div className="">
                <div className="basis-1/3 text-gray-500 text-lg">Address</div>
                <div className="basis-2/3 text-lg">
                  {`${profile.address1} ${profile.address2}`}
                  <br />
                  {`${profile.city}, ${profile.state} ${profile.zip}`}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="my-3">
          <h2 className="text-xl md:text-3xl my-5">Orders</h2>
          <ScrollableTabs
            tabs={tabs}
            selectedTab={selectedTab}
            handleTabClick={(tab) => setSelectedTab(tab)}
          />
          <div className="w-full flex flex-col gap-2">
            {purchasedPublications?.length > 0 && (
              <>
                <div className="overflow-x-scroll bg-white rounded-3xl">
                  <CustomerPurchasedPublicationsTable
                    purchasedPublications={purchasedPublications}
                    isManager={isManager}
                    isWhitelabelOwner={session?.profile?.is_whitelabel}
                  />
                </div>

                {/* <nav className="px-4 flex items-center justify-center sm:px-0 mt-8 sm:mt-12 pb-14">
                            <div className="-mt-px w-0 flex-1 flex">
                            <a
                                href="#"
                                onClick={prevPage}
                                className={classNames(
                                "relative inline-flex items-center pl-3 rounded-full py-2 border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50",
                                paginationData.page > 1 ? "opacity-100" : "opacity-30"
                                )}
                                disabled={paginationData.page <= 1}
                            >
                                <ArrowNarrowLeftIcon
                                className="mr-3 h-5 w-5 text-gray-400"
                                aria-hidden="true"
                                />
                            </a>
                            </div>{" "}
                            <p className="text-sm text-center text-gray-700">
                            <span className="font-medium">
                                {paginationData.pageSize * (paginationData.page - 1) +
                                1}{" "}
                                to{" "}
                                {paginationData.pageSize * (paginationData.page - 1) +
                                purchasedPublications.length}{" "}
                                of <b>{paginationData.total} results</b>
                            </span>
                            </p>
                            <div className="-mt-px w-0 flex-1 flex justify-end">
                            <button
                                onClick={nextPage}
                                className={classNames(
                                "ml-3 relative inline-flex items-center pr-3 rounded-full py-2 border border-gray-300 text-sm font-medium text-gray-700  bg-white hover:bg-gray-50",
                                paginationData.page < paginationData.pageCount
                                    ? "opacity-100"
                                    : "opacity-30"
                                )}
                                disabled={
                                paginationData.page == paginationData.pageCount
                                }
                            >
                                <ArrowNarrowRightIcon
                                className="ml-3 h-5 w-5 text-gray-400"
                                aria-hidden="true"
                                />
                            </button>
                            </div>
                        </nav> */}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export const getServerSideProps = async (context) => {
  const { query, req, params } = context;

  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        permanent: false,
        destination: "/login",
      },
    };
  }

  let site = null;
  if (session.profile.is_whitelabel) {
    site = await API.sites.get({ session, profile_id: session.profile.id });
  }

  let role;
  if (session.profile.is_whitelabel) {
    role = "Whitelabel";
  } else if (session.profile.is_affiliate) {
    role = "Affiliate";
  } else if (session.role == "Manager") {
    role = "Manager";
  } else {
    role = "User";
  }

  return {
    props: {
      session,
      site,
      role: role,
    },
  };
};

export default Customer;
