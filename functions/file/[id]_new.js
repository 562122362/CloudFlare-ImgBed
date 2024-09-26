/**
 *
 *
 * 下载资源
 * @type {string}
 */
let targetUrl = '';

function decode(data,key) {
    let str = ''
    let j = 0;
    for (let i = 0; i < data.length;) {
        let char1 = data.substring(i,i+2)
        let char2 = key[j].charCodeAt()
        let char10 = parseInt(char1, 16)
        let charOrigin = char10 - char2
        let s = String.fromCharCode(charOrigin)
        str += s
        i += 2;
        j++;
    }

    return str
}

export default {
    async fetch(request, env, context) {
        const url = new URL(request.url);
        let Referer = request.headers.get('Referer')
        if (false && Referer) {
            try {
                let refererUrl = new URL(Referer);
                if (env.ALLOWED_DOMAINS && env.ALLOWED_DOMAINS.trim() !== '') {
                    let allowedDomains = env.ALLOWED_DOMAINS.split(',');
                    let isAllowed = allowedDomains.some(domain => {
                        let domainPattern = new RegExp(`(^|\\.)${domain.replace('.', '\\.')}$`); // Escape dot in domain
                        return domainPattern.test(refererUrl.hostname);
                    });
                    if (!isAllowed) {
                        return  new Response('', { status: 400 });// Ensure URL is correctly formed
                    }
                }
            } catch (e) {
                return new Response('', { status: 400 }); // Ensure URL is correctly formed
            }
        }

        // 检查参数是否正常
        let pathInfo = url.pathname.split('/')
        if(pathInfo.length < 2 || pathInfo[0] == '' || pathInfo[1] == ''){
            return new Response('', { status: 400 });
        }

        /**
         * 验签
         * 时间戳 + 文件地址 + token
         */
        let query = decode(pathInfo[1],env.SERVER_KEY)
        let queryArr = query.split('|')

        if(queryArr.length < 3){
            return new Response("未找到页面：" +query , {
                status: 404,
            })
        }

        let targetTime = queryArr[1] * 1000

        if((new Date().getTime() - parseInt(targetTime)) > 1800000){
            return new Response("已过期：" +query , {
                status: 403,
            })
        }

        targetUrl = `https://api.telegram.org/file/bot${env.TG_BOT_TOKEN}/${queryArr[0]}`
        const encodedFileName = encodeURIComponent(queryArr[0].split(".")[0]);
        const fileType = 'image/jpeg';

        const response = await getFileContent(request, env,queryArr[2]);
        if (response === null) {
            return new Response('Error: Failed to fetch image: ' + targetUrl, { status: 500 });
        }

        try {
            const headers = new Headers(response.headers);
            headers.set('Content-Disposition', `inline; filename="${encodedFileName}"`);
            headers.set('Content-Type', fileType);
            const newRes =  new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers,
            });
            return newRes;
        } catch (error) {
            return new Response('Error: ' + error, { status: 500 });
        }
    }// Contents of context object

}

async function getFileContent(request, env, file_id,max_retries = 2) {
    let retries = 0;
    while (retries <= max_retries) {
        try {
            const response = await fetch(targetUrl, {
                method: request.method,
                headers: request.headers,
                body: request.body,
            });
            if (response.ok || response.status === 304) {
                return response;
            } else {
                const filePath = await getFilePath(env, file_id);
                if (filePath) {
                    // 更新targetUrl
                    targetUrl = `https://api.telegram.org/file/bot${env.TG_BOT_TOKEN}/${filePath}`;
                }
                retries++;
            }
        } catch (error) {
            retries++;
        }
    }
    return null;
}

async function getFilePath(env, file_id) {
    try {
        const url = `https://api.se666.app/tg/getFile?id=${file_id}&token=daqianres`;
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                "User-Agent": " Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome"
            },
        })

        let responseData = await res.json();
        if (responseData.code == 0) {
            const file_path = responseData.data
            return file_path
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
}


// const key = 'daqian@pasgf552cdakinn34'
// sign() c8d0d4deced3aee4d4a2cdcfa19a91947a7e75b0b6aebe95989d9fa4a26564979a
// function sign() {
//     const key = 'daqian@pasgf552cEEGFFGBdakinn34dbcljmeikmnxswAefcvDSDe'
//     // let data = 'photos/file_.jpg|1726137583'
//     // let data = 'documents/file_159.jpg|1726642038'
//     let data = 'photos/file_8981.jpg|1726643983' // d4c9e0ddd0e16fd6cadfccc56d6e6a9473afb7adc278799697a19da1a76b67
//     let sign = ''
//     for (let i = 0; i < data.length; i++) {
//         let code = data[i].charCodeAt()
//         let scode = key[i].charCodeAt()
//         console.log('code + scode to16: ', (code + scode).toString(16))
//         sign += '' + (code + scode).toString(16)
//     }
//     console.log(sign)
// }
//
// function decode() {
//     let key = 'daqian@pasgf552cEEGFFGBdakinn34dbcljmeikmnxswAefcvDSDeDDFklklkeEEBBBeeeelffqqefedfkknhghs343433547dd'
//     // 'photos/file_8981.jpg|1727334733|3025436541'
//     let data = 'd4c9e0ddd0e16fd6cadfccc56d6e6a9473afb7adc2787996989e9ca2a56667e095939e9fa1989fa0a19f'
//     let str = ''
//     let j = 0;
//     for (let i = 0; i < data.length;) {
//         let char1 = data.substring(i,i+2)
//         let char2 = key[j].charCodeAt()
//         let char10 = parseInt(char1, 16)
//         let charOrigin = char10 - char2
//         let s = String.fromCharCode(charOrigin)
//         str += s
//         i += 2;
//         j++;
//     }
//
//     return str
// }