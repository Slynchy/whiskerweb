import { BaseAnalytics } from "./BaseAnalytics";
import { GameAnalytics as GA } from "gameanalytics";
import {__WWVERSION} from "../Constants/Constants";

export class GameAnalytics extends BaseAnalytics {
    constructor() {
        super();
    }

    public logEvent(
        eventName: string, valueToSum?: number, parameters?: { [key: string]: string; }
    ): void {
        GA.addDesignEvent(
            eventName,
            valueToSum,
            parameters
        );
    }

    initialize(): void {
        GA.configureBuild(__WWVERSION);
        GA.initialize(
            "",
            ""
        );

        // For GDPR later
        // GA.setEnabledEventSubmission(false);
    }
}
