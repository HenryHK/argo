"use strict";

(function () {
    angular
        .module("argo")
        .controller("OrderDialog", OrderDialog);

    OrderDialog.$inject = ["$mdDialog", "toastService", "params",
        "quotesService", "ordersService"];
    function OrderDialog($mdDialog, toastService,
                        params, quotesService, ordersService) {
        var vm = this;

        vm.changeMarket = changeMarket;
        vm.changeMeasure = changeMeasure;

        vm.type = "market";
        vm.side = params.side;
        vm.instruments = params.instruments;
        vm.selectedInstrument = params.selectedInstrument;
        vm.changeMarket(vm.selectedInstrument);
        vm.expires = [
            {label: "1 Hour", value: 60 * 60 * 1000},
            {label: "2 Hours", value: 2 * 60 * 60 * 1000},
            {label: "3 Hours", value: 3 * 60 * 60 * 1000},
            {label: "4 Hours", value: 4 * 60 * 60 * 1000},
            {label: "5 Hours", value: 5 * 60 * 60 * 1000},
            {label: "6 Hours", value: 6 * 60 * 60 * 1000},
            {label: "8 Hours", value: 8 * 60 * 60 * 1000},
            {label: "12 Hours", value: 12 * 60 * 60 * 1000},
            {label: "18 Hours", value: 18 * 60 * 60 * 1000},
            {label: "1 Day", value: 60 * 60 * 24 * 1000},
            {label: "2 Days", value: 2 * 60 * 60 * 24 * 1000},
            {label: "1 Week", value: 7 * 60 * 60 * 24 * 1000},
            {label: "1 Month", value: 30 * 60 * 60 * 24 * 1000},
            {label: "2 Months", value: 60 * 60 * 60 * 24 * 1000},
            {label: "3 Months", value: 90 * 60 * 60 * 24 * 1000}
        ];
        vm.selectedExpire = 604800000; // 1 week
        vm.measure = "price";
        vm.isLowerBound = false;
        vm.isUpperBound = false;
        vm.isTakeProfit = false;
        vm.isStopLoss = false;
        vm.isTrailingStop = false;

        function changeMarket(instrument) {
            var price = quotesService.getQuotes()[instrument];

            vm.step = 0.0001;
            if (vm.side === "buy") {
                vm.quote = price && price.ask;
                vm.takeProfit = vm.quote + vm.step * 10;
                vm.stopLoss = vm.quote - vm.step * 10;
            } else {
                vm.quote = price && price.bid;
                vm.takeProfit = vm.quote - vm.step * 10;
                vm.stopLoss = vm.quote + vm.step * 10;
            }
            vm.lowerBound = vm.quote - vm.step;
            vm.upperBound = vm.quote + vm.step;
            vm.trailingStop = 25;
        }

        function changeMeasure(measure) {
            if (measure === "price") {
                changeMarket(vm.selectedInstrument);
            } else {
                vm.lowerBound = 1;
                vm.upperBound = 1;
                vm.takeProfit = 10;
                vm.stopLoss = 10;
                vm.trailingStop = 25;
                vm.step = 1;
            }
        }

        vm.hide = function () {
            $mdDialog.hide();
        };

        vm.cancel = function () {
            $mdDialog.cancel();
        };

        vm.answer = function (action) {
            var order = {};

            $mdDialog.hide(action);

            order.instrument = vm.selectedInstrument;
            order.units = vm.units;
            order.side = vm.side;
            order.type = vm.type;

            if (order.type === "limit") {
                order.price = vm.quote;
                order.expiry = new Date(Date.now() + vm.selectedExpire);
            }

            if (vm.isLowerBound) {
                order.lowerBound = vm.lowerBound.toFixed(4);
            }
            if (vm.isUpperBound) {
                order.upperBound = vm.upperBound.toFixed(4);
            }
            if (vm.isStopLoss) {
                order.stopLoss = vm.stopLoss.toFixed(4);
            }
            if (vm.isTakeProfit) {
                order.takeProfit = vm.takeProfit.toFixed(4);
            }
            if (vm.isTrailingStop) {
                order.trailingStop = vm.trailingStop;
            }

            if (action === "submit") {
                ordersService.putOrder(order).then(function (transaction) {
                    var opened,
                        message;

                    if (transaction.code && transaction.message) {
                        message = "ERROR " +
                            transaction.code + " " +
                            transaction.message;

                        toastService.show(message);
                    } else {
                        opened = transaction.tradeOpened ||
                            transaction.orderOpened;
                        message = opened.side + " " +
                            transaction.instrument +
                            " #" + opened.id +
                            " @" + transaction.price +
                            " for " + opened.units;

                        toastService.show(message);
                    }
                });
            }
        };
    }

}());