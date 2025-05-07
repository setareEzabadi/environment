import Campaigns from "../../../components/Campaigns/Campaigns";
import env from "../../../env";

export default function Home({ initialCampaigns = [], initialStatuses = [] }) {
  return (
    <Campaigns
      initialCampaigns={initialCampaigns}
      initialStatuses={initialStatuses}
    />
  );
}

export async function getServerSideProps(context) {
  const { req } = context;
  // فرض می‌کنیم توکن تو کوکی‌ها ذخیره شده
  const token = req.cookies.auth_token || "";

  try {
    // دریافت همه کمپین‌ها
    const campaignsRes = await fetch(`${env.baseUrl}api/getCampaigns`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const campaignsData = await campaignsRes.json();

    // دریافت وضعیت‌های کمپین
    const statusesRes = await fetch(`${env.baseUrl}api/campaign-statuses`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const statusesData = await statusesRes.json();

    return {
      props: {
        initialCampaigns: Array.isArray(campaignsData.data)
          ? campaignsData.data
          : [],
        initialStatuses: Array.isArray(statusesData.data)
          ? statusesData.data
          : [],
      },
    };
  } catch (error) {
    console.error("خطا در getServerSideProps:", error);
    return {
      props: {
        initialCampaigns: [],
        initialStatuses: [],
      },
    };
  }
}
