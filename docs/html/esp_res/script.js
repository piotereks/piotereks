        // Initialize highlight.js
        document.addEventListener('DOMContentLoaded', (event) => {
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightBlock(block);
            });
        });

        // Function to get URL parameter value by name
        function getUrlParameter(name) {
            name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
            var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
            var results = regex.exec(location.search);
            return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
        };

        // Get the 'word' parameter from the URL, if it exists
        var urlWord = getUrlParameter('word');
        if (urlWord !== '') {
            document.getElementById('word').value = urlWord;
            // Manually trigger the search when the word parameter is in the URL
            searchWord(urlWord);
        }

        document.getElementById("searchForm").addEventListener("submit", function (event) {
            event.preventDefault();
            var word = document.getElementById("word").value;
            searchWord(word);
        });

        // Toggle visibility of collapsible content
        var collapsibles = document.getElementsByClassName("collapsible");
        for (var i = 0; i < collapsibles.length; i++) {
            collapsibles[i].addEventListener("click", function () {
                this.classList.toggle("active");
                var content = this.nextElementSibling;
                if (content.style.display === "block") {
                    content.style.display = "none";
                } else {
                    content.style.display = "block";
                }
            });
        }

        // Manually trigger opening of the first section when the page is loaded
        document.addEventListener('DOMContentLoaded', function () {
            var firstCollapsible = document.getElementById("defFrameBtn");
            firstCollapsible.click();
        });

        function searchWord(word) {
            var defUrl = "https://www.wordreference.com/definicion/" + encodeURIComponent(word);
            var sinUrl = "https://www.wordreference.com/sinonimos/" + encodeURIComponent(word);
            var spenUrl = "https://www.wordreference.com/es/en/translation.asp?spen=" + encodeURIComponent(word);
            var raeUrl = "https://dle.rae.es/" + encodeURIComponent(word);
            //var graUrl = "https://www.wordreference.com/gramatica/" + encodeURIComponent(word);
            var conUrl = "https://www.wordreference.com/conj/esverbs.aspx?v=" + encodeURIComponent(word);
            var spellUrl = "https://spell.wordreference.com/spell/spelljs.php?dict=eses&w="+ encodeURIComponent(word);
            //document.getElementById(sinLink).href = sinUrl;
            //document.getElementById(graLink).href = graUrl;
            //document.getElementById(conLink).href = conUrl;
            document.getElementById("defLink").href = defUrl;
            document.getElementById("sinLink").href = sinUrl;
            document.getElementById("spenLink").href = spenUrl;
            document.getElementById("raeLink").href = raeUrl;
            //document.getElementById("graLink").href = graUrl;
            document.getElementById("conLink").href = conUrl;

            fetchAndDisplay(defUrl, "defFrameContent", '#otherDicts', spellUrl);
            fetchAndDisplay(sinUrl, "sinFrameContent", '#article', undefined, "sinLink");
            fetchAndDisplay(spenUrl, "spenFrameContent", '#articleWRD', undefined);
            fetchAndDisplay(raeUrl, "raeFrameContent", '#resultados > article', undefined);
            //fetchAndDisplay(graUrl, "undefined", '#otherDicts', undefined, "graLink");
            fetchAndDisplay(conUrl, "conFrameContent", '#contenttable > tbody > tr > td > table > tbody > tr > td:nth-child(2)', undefined, "conLink");
            
            // document.querySelector("#container > div.content")
            // document.querySelector("#contenttable > tbody > tr > td > table > tbody > tr > td:nth-child(2)")
        }

        function fetchAndDisplay(url, targetElementId, querySelectorName, urlSpell,  linkId) {
            const useCorsProxy = url.includes('dle.rae.es');
            const fetchUrl = useCorsProxy
                ? `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
                : url;
            fetch(fetchUrl)
                .then(response => {
                    if (useCorsProxy) {
                        return response.json().then(data => data.contents);
                    }
                    return response.text();
                })
                .then(html => {

                    var parser = new DOMParser();
                    var doc = parser.parseFromString(html, 'text/html');
                    var content = doc.querySelector(querySelectorName);
                    // Remove the specific span element with id "browserInfo"
                    if (content) {
                        // Remove the specific span element with id "browserInfo"
                        var browserInfoElement = content.querySelector('#browserInfo');
                        if (browserInfoElement) {
                            browserInfoElement.remove();
                        }
                    }


                    var targetElement = document.getElementById(targetElementId);
                    // console.log('url: '+url);
                    // console.log('!content '+!content);
                    // console.log(content.innerText);
                    // If content is not found, try fetching from the alternate URL
                    if ((!content || content.innerHTML.trim()==="") && urlSpell!=="" && typeof urlSpell !== "undefined") {
                         return fetch(urlSpell)
                        .then(response => response.text())
                        .then(htmlSpell => {
                            var docSpell = parser.parseFromString(htmlSpell, 'text/html');
                            var table = docSpell.querySelector("table"); // Extract the <table> element

                            if (table) {
                                 var currentFileName = window.location.pathname.split('/').pop();
                                // Find all <a> elements and update their href attributes
                                var links = table.querySelectorAll("a");
                                links.forEach(link => {
                                    var originalHref = link.getAttribute("href");
                                    link.setAttribute("href", `${currentFileName}?word=${originalHref}`);
                                });

                                // Update the target element with the modified table
                                targetElement.innerHTML = table.outerHTML ? table.outerHTML : "No content found.";
                            } else {
                                targetElement.innerHTML = "No table content found from alternate URL.";
                            }
                        });

                    } else {
                             targetElement.innerHTML = content && content.innerText && content.innerText.trim() ? content.innerHTML : "No content found.";
                    };

                })
                .catch(error => {
                    console.error('Error fetching content:', error);
                    if (targetElementId) {
                        targetElement.textContent = "Error fetching content.";
                    }

                });

            // Update link href if linkId is provided
            if (linkId) {
                document.getElementById(linkId).href = url;
            }
        }