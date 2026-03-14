import PageLayoutOverview from '../../../../../../components/ui/page-layouts/PageLayoutOverview';
import pageLayoutOverviews from '../../../../../../lib/constants/pageLayoutOverviews';

function CardedWithSidebarsOverviewComponent() {
	return <PageLayoutOverview layoutOptions={pageLayoutOverviews.carded.withSidebars} />;
}

export default CardedWithSidebarsOverviewComponent;
