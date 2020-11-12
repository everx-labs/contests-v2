const GA_DISABLED = false || !window.gtag;

export default class GA {
    static isDisabled() {
        return GA_DISABLED;
    }

    static Categories = Object.freeze({
        Request: 'Request',
        OutLinks: 'OutLinks',
        Job: 'Job',
        Press: 'Press',
    });

    static sendEvent(event_name, event_category, event_label, event_callback) {
        if (this.isDisabled()) {
            event_callback && event_callback();
            return;
        }
        window.gtag('event', event_name, {
            event_category,
            event_label,
        });
        event_callback && event_callback();
    }


    static showFeedbackForm(event_callback) {
        this.sendEvent('showFeedbackForm', this.Categories.Request, null, event_callback);
    }

    static sendFeedback(event_label, event_callback) {
        this.sendEvent('sendFeedback', this.Categories.Request, event_label, event_callback);
    }

    static submitJobForm(event_label, event_callback) {
        this.sendEvent('submitJobForm', this.Categories.Job, event_label, event_callback);
    }

    static goContacts(event_label, event_callback) {
        this.sendEvent('goContacts', this.Categories.OutLinks, event_label, event_callback);
    }

    static goTonDev(event_label, event_callback) {
        this.sendEvent('goTonDev', this.Categories.OutLinks, event_label, event_callback);
    }

    static goTonSpace(event_callback) {
        this.sendEvent('goTonSpace', this.Categories.OutLinks, null, event_callback);
    }

    static goTonSurf(event_callback) {
        this.sendEvent('goTonSurf', this.Categories.OutLinks, null, event_callback);
    }

    static goGramScan(event_callback) {
        this.sendEvent('goGramScan', this.Categories.OutLinks, null, event_callback);
    }

    static goStayInTouch(event_callback) {
        this.sendEvent('goStayInTouch', this.Categories.OutLinks, null, event_callback);
    }

    static pressAction(event_label, event_callback) {
        this.sendEvent('pressAction', this.Categories.Press, event_label, event_callback);
    }
}
