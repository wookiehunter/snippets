import React, { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import Navbar from "@/components/navbar";
import CheckoutForm from "@/components/checkout/checkoutForm";
import { useRouter } from "next/router";
import { getSession, useSession } from "next-auth/react";
import API from "@/lib/api";
import SiteWrapper from "@/components/siteWrapper";
// import CartManager from "@/lib/cart-manager";
// import { ArrowNarrowLeftIcon } from "@heroicons/react/outline";

// Make sure to call loadStripe outside of a component’s render to avoid
// recreating the Stripe object on every render.
// This is your test publishable API key.
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

function InvoiceCheckoutPage({ invoice, siteData, items, session, profile }) {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState("");

  const getStripeSecret = async ( {items, processingFee, totalPayment, siteData, profile} ) => {
    return await API.orders
      .invoice(
        {
          data: {
            status: "created",
            items: items,
            total: totalPayment,
            processing_fee: processingFee,
            site: siteData,
            profile: profile,
          },
        },
        session
      )
      .then(function (result) {
        // console.log({ result });
        if (result.data) {
          const clientSecret = result.data?.client_secret;
          // console.log('clientSecret', clientSecret);
          setClientSecret(clientSecret);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const invoiceID = invoice.id;
  const siteName = siteData.attributes.name;

  let processingFee = invoice.attributes.total * 0.039;
  processingFee = processingFee.toFixed(2);

  let totalPayment = invoice.attributes.total + (invoice.attributes.total * 0.039);
  totalPayment = totalPayment.toFixed(2);


  useEffect(() => {
    getStripeSecret({
      items,
      processingFee,
      totalPayment,
      siteData,
      profile
    })
  }, []);


  const appearance = {
    theme: "flat",
    variables: {
      colorPrimary: siteData.attributes.primary_color ? siteData.attributes.primary_color : "#2302FD"
    },
  };
  const options = {
    clientSecret,
    appearance,
  };

  return (
    <SiteWrapper siteData={siteData} isCheckout={true}>
      <section className="bg-[#F8F7FC]">
        <div className="h-screen">
          <div className="flex flex-col sm:grid grid-cols-2 h-full">
            <div className="max-w-sm w-full px-4 mr-20 ml-auto flex flex-col justify-between py-10">
              <div>

                <div className="mt-10">
                  <p className="text-lg text-gray-500">Pay {siteName}</p>
                  <p className="text-4xl font-medium mt-2">
                    ${totalPayment}
                  </p>
                </div>

                <div className="mt-10 space-y-2">
                  {items.map((item) => {
                    return (
                      <div key={item.art_id} className="flex justify-between">
                        <p className="font-bold">{item?.art_name}</p>
                        <p>${item.pur_pub_price}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-3">
                    <p className="">Processing Fee (3.9%)</p>
                    <p>${processingFee}</p>
                  </div>
              </div>

              <div className="flex gap-1 items-end">
                <p className="text-gray-600">Powered by{"  "}</p>
                <img src="stripe.svg" className="w-10 mb-[2px]" />
              </div>
            </div>
            <div className="bg-white py-10">
              <div className="sm:max-w-sm w-full px-4 sm:ml-20 sm:mr-auto">
                {clientSecret && (
                  <Elements options={options} stripe={stripePromise}>
                    <CheckoutForm />
                  </Elements>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteWrapper>
  );
}

export const getServerSideProps = async (context) => {
  // console.log('context', context.query.invoice_id);
  const session = await getSession(context);
  const profile = session.profile

  // console.log('session', session);
  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const invoiceID = context.query.invoice_id;
  let invoice;
  if (session) {
    invoice = await API.invoice.findOne({
      id: invoiceID,
      session: session,
    })
    .then((response) => {
      const newResponse = response.data.data;
      return newResponse;
    })
  }

  let items = invoice.attributes.items;
  // console.log('items', items);

  const { params } = context;
  const { site } = params;
  // console.log("site params", site)
  let siteData;
  if (site.includes(".")) {
    siteData = await API.sites.get({ customDomain: site });
  } else {
    siteData = await API.sites.get({ subdomain: site });
  }

  return {
    props: {
      invoice,
      siteData,
      items,
      session,
      profile
    },
  };
};

export default InvoiceCheckoutPage;
