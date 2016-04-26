'use strict';

var context;
var web;
var user;
var currentItem;
var hostweburl;
var appweburl;
var title;
var list;


$(document).ready(function() {
    appweburl = GetAppSiteUrl();
    hostweburl = GetHostSiteUrl();

    var scriptbase = hostweburl + "/_layouts/15/";
    $.getScript(scriptbase + "SP.RequestExecutor.js");

    var clientContext = new SP.ClientContext.get_current();
    var parentCtx = new SP.AppContextSite(clientContext, hostweburl);
    var web = parentCtx.get_web();
    clientContext.load(web);
    var listId = GetListId();
    list = web.get_lists().getById(listId);
    clientContext.load(list);
    var itemId = GetItemId();
    currentItem = list.getItemById(itemId);
    clientContext.load(currentItem);

    clientContext.executeQueryAsync(onlistLoadSucceeded, onRequestFailed);

});

function onListLoadSucceeded() {
    title = currentItem.get_fieldValues().Name;
    getSearchResult(title);
}

function onRequestFailed(sender, args) {
    alert("Error:" + args.get_message());
}

function DoSearch() {
    var query = $('#txtsearch').val();
    getSearchResult(query);
}

function getSearchResult(queryText) {
    $("#search-title").text("buscar resultados para [" + queryText + "]");

    var searchurl = appweburl + "/_api/search/query?querytext=" + queryText + "&trimduplicates=false";
    var executor = new SP.RequestExecutor(appweburl);
    executor.executeAsync({
        url: searchurl,
        method: "GET",
        headers: { "Accept": "application/json; odata=verbose" },
        success: onGetSearchResultsSuccess,
        error: onGetSearchResultsFail
    });
}

function onGetSearchResultsSuccess(data) {
    var jsonObject = JSON.parse(data.body);
    var results = jsonObject.d.query.PrimaryQueryResult.RelevantResults.Table.Rows.reuslts;
    if (results.length == 0) {
        $("#search-results").text("No se han encontrado items");
    } else {
        var searchResultsHtml = "";
        $.each(results, function(index, result) {
            searchResultsHtml += "<a target='_blank' href=" + results.Cells.results[6].Value + "'>" + result.Cells.reuslts[6].Value + "</a></br>";

        });

        $("#search-results").html(searchResultsHtml);
    }
}

function onGetSearchResultsFail(data, errorCode, errorMessage) {
    $("#search-results").text("Ha ocurrido un error durante la búsqueda - " + errorMessage);
}

function getQueryStringParameter(paramToRetrieve) {
    var params = document.URL.split("?")[1].split("&");
    for (var i = 0; i < params.length; i = i + 1) {
        var singleParam = params[i].split("=");
        if (singleParam[0] == paramToRetrieve) {
            return singleParam[1];
        }
    }
}

function GetListId() {
    return decodeURIComponent(getQueryStringParameter("ListID"));
}

function GetHostSiteUrl() {
    return decodeURIComponent(getQueryStringParameter("SPHostUrl"));
}

function GetAppSiteUrl() {
    return decodeURIComponent(getQueryStringParameter("SPAppWebUrl"));
}

function GetItemId() {
    return getQueryStringParameter("ItemID");
}