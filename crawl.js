import { JSDOM } from 'jsdom'

async function beginCrawl(baseURL){
    try {
        const response = await fetch(baseURL)

        if (response.status > 399){
            console.log(`error in fetch with status code: ${response.status} on page: ${baseURL}`)
            return
        }

        const contentType = response.headers.get("content-type")
        if (!contentType .includes("text/html")){
            console.log(`non html response: ${contentType} on page: ${baseURL}`)
            return
        }

        console.log(await response.text())
    } catch (error) {
        console.log(`error fetching page: ${error.message} on page ${baseURL}`)
    }
}

export function normalizeURL(urlString){
    const urlObject = new URL(urlString);
    const hostPath =  `${urlObject.hostname}${urlObject.pathname}`
    if (hostPath.length > 0 && hostPath.slice(-1) === '/'){
        return hostPath.slice(0,-1)
    }
    return hostPath
}

export function getURLsFromHTML(htmlBody, baseURL){
    const urls = []
    const dom = new JSDOM(htmlBody) // taking html as string and creating DOM
    const linkElements = dom.window.document.querySelectorAll('a')
    for (const linkElement of linkElements){
        if (linkElement.href.slice(0,1) === '/') {
            //relative url
            try {
                const urlObj = new URL(`${baseURL}${linkElement.href}`)
                urls.push(urlObj.href)
            } catch (error) {
                console.log(`error with relative url: ${error.message}`)
            }
        } else {
            // absolute
            try {
                const urlObj = new URL(`${linkElement.href}`)
                urls.push(urlObj.href)
            } catch (error) {
                console.log(`error with absolute url: ${error.message}`)
            }
        }
    }
    return urls
}

export async function crawlPage(baseURL, currentURL = baseURL, pages = {}) {

    const baseHostName = new URL(baseURL)
    const currentHostName = new URL(currentURL)

    if (baseHostName.hostname !== currentHostName.hostname){
        return pages
    }

    const normalizedCurrentURL = normalizeURL(currentURL)

    if (pages[normalizedCurrentURL] > 0){
        pages[normalizedCurrentURL]++
        return pages
    }

    pages[normalizedCurrentURL] = 1
   
    try {
        const response = await fetch(baseURL)

        if (response.status > 399){
            console.log(`error in fetch with status code: ${response.status} on page: ${baseURL}`)
            return pages
        }

        const contentType = response.headers.get("content-type")
        if (!contentType .includes("text/html")){
            console.log(`non html response: ${contentType} on page: ${baseURL}`)
            return pages
        }

        const htmlBody = await response.text()
        const nextURLs = getURLsFromHTML(htmlBody, baseURL)

        for (const nextURL of nextURLs){
            pages = await crawlPage(baseURL, nextURL, pages)
        }

    } catch (error) {
        console.log(`error fetching page: ${error.message} on page ${baseURL}`)
    }
    return pages

}
