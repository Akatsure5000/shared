function getWeldingToday(data, date) {
    const today = new Date(date).toISOString().slice(0, 10)

    const equals = data.filter((item) => {
        const date = new Date(item.createdAt).toISOString().slice(0, 10)
        return date === today
    })

    return equals
}

function sliceSquadWeldings(data) {
    let result = []

    const allGroupsWeldBead = data
        .reduce(function (accumulator, currentValue, currentIndex, array) {
            if (
                !currentIndex ||
                array[currentIndex - 1].capture !== currentValue.capture
            ) {
                accumulator.push({
                    id: currentValue.capture,
                    amperagem: [currentValue.amperagem],
                    tempoInicial: currentValue.createdAt,
                    tempoFinal: currentValue.createdAt,
                })
            } else {
                accumulator[accumulator.length - 1].amperagem.push(
                    currentValue.amperagem
                )
                accumulator[accumulator.length - 1].tempoFinal =
                    currentValue.createdAt
            }

            return accumulator
        }, [])
        .map((item) => {
            item.tempoDeArc = (item.tempoFinal - item.tempoInicial) / 1000
            item.tipo = item.amperagem.length <= 2 ? 'ponto' : 'cordao'
            return item
        })

        console.log(allGroupsWeldBead)

    // console.log(allGroupsWeldBead)

    // data.forEach(({ capture, amperagem, createdAt }) => {
    //     const existingItem = result.find((item) => item.id === capture)
    //     if (!existingItem) {
    //         result.push({
    //             id: capture,
    //             amperagem: [amperagem],
    //             tempoInicial: createdAt,
    //             tempoFinal: createdAt,
    //         })
    //     } else {
    //         existingItem.tempoFinal = createdAt
    //         existingItem.amperagem.push(amperagem)
    //     }
    // })

    // result.forEach((item) => {
    //     const arcAberto = item.tempoFinal - item.tempoInicial
    //     const second = Math.floor(arcAberto / 1000)

    //     if (second) item.tempoDeArc = second

    //     item.arrayLength = item.amperagem.length

    //     if (item.amperagem.length <= 2) {
    //         item.tipo = 'ponto de solda'
    //     } else {
    //         item.tipo = 'cordão de solda'
    //     }
    //     const sumAmp = item.amperagem.reduce((acc, item) => acc + item, 0)
    //     const media = Math.floor(sumAmp / item.amperagem.length)
    //     item.media = media
    // })

    // result.forEach((item) => {
    //     let maior = item.amperagem[0]
    //     let menor = item.amperagem[0]

    //     for (let i = 1; i < item.amperagem.length; i++) {
    //         if (item.amperagem[i] > maior) maior = item.amperagem[i]

    //         if (item.amperagem[i] < menor) menor = item.amperagem[i]
    //     }

    //     item.maior = maior
    //     item.menor = menor

    //     delete item.amperagem
    // })

    // return result
    return allGroupsWeldBead
}

function sliceLastProcess(data) {
    let result = []

    data.forEach(({ capture, amperagem, createdAt, weldingId, prometeus }) => {
        console.log(weldingId)
        const existingItem = result.find((item) => item.id === capture)
        if (!existingItem) {
            result.push({
                id: capture,
                amperagem: [amperagem],
                tempoInicial: createdAt,
                tempoFinal: createdAt,
                prometeus: prometeus.prometeusCode,
            })
        } else {
            existingItem.tempoFinal = createdAt
            existingItem.amperagem.push(amperagem)
        }
    })

    result.forEach((item) => {
        const arcAberto = item.tempoFinal - item.tempoInicial
        const second = Math.floor(arcAberto / 1000)

        if (second) item.tempoDeArc = second
        else item.tempoDeArc = second + 1

        const sumAmp = item.amperagem.reduce((acc, item) => acc + item, 0)
        const media = Math.floor(sumAmp / item.amperagem.length)
        item.media = media
    })

    result.forEach((item) => {
        let maior = item.amperagem[0]
        let menor = item.amperagem[0]

        for (let i = 1; i < item.amperagem.length; i++) {
            if (item.amperagem[i] > maior) maior = item.amperagem[i]

            if (item.amperagem[i] < menor) menor = item.amperagem[i]
        }

        item.maior = maior
        item.menor = menor

        delete item.amperagem
    })

    return result
}

module.exports = {
    getWeldingToday,
    sliceLastProcess,
    sliceSquadWeldings,
}
