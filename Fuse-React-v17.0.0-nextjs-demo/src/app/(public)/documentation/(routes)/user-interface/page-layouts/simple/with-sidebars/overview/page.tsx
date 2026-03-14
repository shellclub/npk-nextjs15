import PageLayoutOverview from '../../../../../../components/ui/page-layouts/PageLayoutOverview';
import pageLayoutOverviews from '../../../../../../lib/constants/pageLayoutOverviews';

function SimpleWithSidebarsOverviewComponent() {
	return <PageLayoutOverview layoutOptions={pageLayoutOverviews.simple.withSidebars} />;
}

export default SimpleWithSidebarsOverviewComponent;
