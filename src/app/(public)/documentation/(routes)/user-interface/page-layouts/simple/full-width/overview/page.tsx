import PageLayoutOverview from '../../../../../../components/ui/page-layouts/PageLayoutOverview';
import pageLayoutOverviews from '../../../../../../lib/constants/pageLayoutOverviews';

function SimpleFullWidthOverviewComponent() {
	return <PageLayoutOverview layoutOptions={pageLayoutOverviews.simple.fullWidth} />;
}

export default SimpleFullWidthOverviewComponent;
