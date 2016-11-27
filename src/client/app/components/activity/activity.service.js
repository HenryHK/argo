"use strict";

(function () {
    angular
        .module("components.activity")
        .factory("activityService", activityService);

    activityService.$inject = ["$http", "$q",
        "sessionService", "accountsService"];
    function activityService($http, $q, sessionService, accountsService) {
        var activities = [],
            service = {
                getActivities: getActivities,
                addActivity: addActivity
            };

        return service;

        function getActivities() {
            var deferred = $q.defer(),
                account = accountsService.getAccount(),
                lastTransactionID = account.lastTransactionID;

            sessionService.isLogged().then(function (credentials) {
                $http.post("/api/transactions", {
                    environment: credentials.environment,
                    token: credentials.token,
                    accountId: credentials.accountId,
                    lastTransactionID: lastTransactionID
                }).then(function (transactions) {
                    activities = transactions.data.reverse();
                    deferred.resolve(activities);
                });
            });

            return deferred.promise;
        }

        function addActivity(activity) {
            activities.splice(0, 0, {
                id: activity.id,
                type: activity.type,
                instrument: activity.instrument,
                units: activity.units,
                price: activity.price,
                pl: activity.pl,
                // PROFIT (PIPS)
                // PROFIT (%)
                accountBalance: activity.accountBalance,
                time: activity.time
            });
        }
    }

}());