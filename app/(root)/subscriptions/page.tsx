import { PricingTable } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Plans & Pricing | Bookified AI',
    description: 'Upgrade your Bookified AI plan to unlock more books, longer sessions, and session history.',
};

export default async function SubscriptionsPage() {
    const { userId } = await auth();
    if (!userId) redirect('/sign-in');

    return (
        <div className="clerk-subscriptions">
            <h1 className="page-title">Plans &amp; Pricing</h1>
            <p className="page-description text-(--text-secondary)">
                Upgrade to unlock more books, longer voice sessions, and session history.
            </p>
            <div className="clerk-pricing-table-wrapper mt-10 w-full">
                <PricingTable />
            </div>
        </div>
    );
}
