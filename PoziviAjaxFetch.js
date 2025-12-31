const PoziviAjaxFetch = (function () {

    const BASE_URL = "http://localhost:3000/api";

    function fetchJSON(url, options, callback) {
        fetch(url, options)
            .then(response =>
                response.json()
                    .then(data => callback(response.status, data))
                    .catch(() => callback(response.status, null))
            )
            .catch(() => callback(0, null));
    }

    return {

        postScenario: function (title, callback) {
            fetchJSON(`${BASE_URL}/scenarios`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ title })
            }, callback);
        },

        getScenario: function (scenarioId, callback) {
            fetchJSON(`${BASE_URL}/scenarios/${scenarioId}`, {
                method: "GET"
            }, callback);
        },

        getDeltas: function (scenarioId, since, callback) {
            fetchJSON(`${BASE_URL}/scenarios/${scenarioId}/deltas?since=${since}`, {
                method: "GET"
            }, callback);
        },

        lockLine: function (scenarioId, lineId, userId, callback) {
    fetchJSON(`${BASE_URL}/scenarios/${scenarioId}/lines/${lineId}/lock`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId })
    }, callback);
    },

    updateLine: function (scenarioId, lineId, userId, newText, callback) {
    fetchJSON(`${BASE_URL}/scenarios/${scenarioId}/lines/${lineId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId, newText })
    }, callback);
},

lockCharacter: function (scenarioId, characterName, userId, callback) {
    fetchJSON(`${BASE_URL}/scenarios/${scenarioId}/characters/lock`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId, characterName })
    }, callback);
},

updateCharacter: function (scenarioId, userId, oldName, newName, callback) {
    fetchJSON(`${BASE_URL}/scenarios/${scenarioId}/characters/update`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId, oldName, newName })
    }, callback);
}


    };

})();
