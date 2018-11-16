queue()
    .defer(d3.csv, "data/HHSCyberSecurityBreaches.csv")
    .await(makeGraphs);
    

function makeGraphs(error, securityData) {
    var ndx = crossfilter(securityData);
    
    securityData.forEach(function(d){
        d.Individuals_Affected = parseInt(d.Individuals_Affected);
    });
    
    show_state(ndx);
    show_attack_type_bar(ndx);
    show_attack_type_pie(ndx);
    show_attack_item_bar(ndx);
    show_attack_item_pie(ndx);
    show_type_distribution(ndx);
    show_average_impact_by_type(ndx);
    show_average_impact_by_item(ndx);
    
    dc.renderAll();
}
    
function rankByType(dimension, Type_of_Breach) {
    return dimension.group().reduce(
        function (p, v) {
            p.total++;
            if(v.Type_of_Breach == Type_of_Breach) {
                p.match++;
            }
            return p;
        },
        function (p, v) {
            p.total--;
            if(v.Type_of_Breach == Type_of_Breach) {
                p.match--;
            }
            return p;
        },
        function () {
            return {total: 0, match: 0};
        }
    );
}




function show_state(ndx) {
    var dim = ndx.dimension(dc.pluck('State'));
    var group = dim.group();
    
    dc.selectMenu("#state-selector")
        .dimension(dim)
        .group(group);
}


function show_attack_type_bar(ndx) {
    var dim = ndx.dimension(dc.pluck('Type_of_Breach'));
    var group = dim.group();
    
    dc.barChart("#attack-type-bar")
        .width(600)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(dim)
        .group(group)
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .xAxisLabel("Type of Breached Information")
        .yAxis().ticks(10);
}



function show_attack_type_pie(ndx) {
    var dim = ndx.dimension(dc.pluck('Type_of_Breach'));
    var group = dim.group();
    
    dc.pieChart('#attack-type-pie')
        .height(330)
        .radius(90)
        .transitionDuration(1500)
        .dimension(dim)
        .group(group);
}



function show_attack_item_bar(ndx) {
    var dim = ndx.dimension(dc.pluck('Location_of_Breached_Information'));
    var group = dim.group();
    
    dc.barChart("#attack-item-bar")
        .width(600)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(dim)
        .group(group)
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .xAxisLabel("Location of the Breached Information")
        .yAxis().ticks(10);
}


function show_attack_item_pie(ndx) {
    var dim = ndx.dimension(dc.pluck('Location_of_Breached_Information'));
    var group = dim.group();
    
    dc.pieChart('#attack-item-pie')
        .height(330)
        .radius(90)
        .transitionDuration(1500)
        .dimension(dim)
        .group(group);
}


function show_type_distribution(ndx) {
    
    var dim = ndx.dimension(dc.pluck("Location_of_Breached_Information"));
    var theftByType = rankByType(dim, "Theft");
    var otherByType = rankByType(dim, "Other");
    var hackingByType = rankByType(dim, "Hacking");
    var lossByType = rankByType(dim, "Loss");
    var unauthorizedAccessByType = rankByType(dim, "Unauthorized Access");
    var unknownByType = rankByType(dim, "Unknown");
    var improperDisposalByType = rankByType(dim, "Improper Disposal");

    dc.barChart("#type-distribution")
        .width(800)
        .height(350)
        .dimension(dim)
        .group(theftByType, "Theft")
        .stack(otherByType, "Other")
        .stack(hackingByType, "Hacking")
        .stack(lossByType, "Loss")
        .stack(unauthorizedAccessByType, "Unauthorized Access")
        .stack(unknownByType, "Unknown")
        .stack(improperDisposalByType, "Improper Disposal")
        .valueAccessor(function(d) {
            if(d.value.total > 0) {
                return (d.value.match / d.value.total) * 100;
            } else {
                return 0;
            }
        })
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .legend(dc.legend().x(655).y(20).itemHeight(20).gap(1))
        .margins({top: 10, right: 170, bottom: 30, left: 30});
}


// Divides the number of people affected by a type of breach by the number of people affected, to get the average impact
function add_item(p, v) {
    p.count++;
    p.total += v.Individuals_Affected;
    p.average = p.total / p.count;
    return p;
}


// Sets the total and average to zero, if the count is zero. Otherwise, calculates the average by subtracting the number of individuals affected from the total, then dividing this by the count.
function remove_item(p, v) {
    p.count--;
    if(p.count == 0) {
        p.total = 0;
        p.average = 0;
    } else {
        p.total -= v.Individuals_Affected;
        p.average = p.total / p.count;
    }
    return p;
}


// Initialises the count, total and average to zero.
function initialise() {
    return {count: 0, total: 0, average: 0};
}




function show_average_impact_by_type(ndx) {
    var dim = ndx.dimension(dc.pluck('Type_of_Breach'));
    var averageImpactByType = dim.group().reduce(add_item, remove_item, initialise);

    dc.barChart("#average-impact-type")
        .width(600)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(dim)
        .group(averageImpactByType)
        .valueAccessor(function(d){
            return d.value.average.toFixed(2);
        })
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .elasticY(true)
        .xAxisLabel("Breach Type")
        .yAxis().ticks(4);
}






function show_average_impact_by_item(ndx) {
    var dim = ndx.dimension(dc.pluck('Location_of_Breached_Information'));
    var averageImpactByType = dim.group().reduce(add_item, remove_item, initialise);

    dc.barChart("#average-impact-item")
        .width(600)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(dim)
        .group(averageImpactByType)
        .valueAccessor(function(d){
            return d.value.average.toFixed(2);
        })
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .elasticY(true)
        .xAxisLabel("Breach Location")
        .yAxis().ticks(4);
}