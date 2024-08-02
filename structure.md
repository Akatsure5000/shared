# ControllerServiceCycle

usado para obter o ciclo de trabalho durante determinado dia

## Encontrar vários weldings

[{
    <!-- id -->
    capture
    amperagem
    createdAt
    <!-- weldingId (prometeus) -->
}]

## sliceSquadWeldings
    (REGISTROS DE SOLDA DE UM PROMETEUS)
    [{
        id
        [amperagem]
        tempoInicial
        tempoFinal   
    }]
-----
    [{
        +tempoDeArc = tempoInicial - tempoFinal
        +arrayLength = amperagem.length
        +tipo = amperagem.lenth < 2 'ponto' : 'cordao'
        +media = soma([amperagem] / item.amperagem.length)
    }]
-----
    [{
        +maior = max(amperagem)
        +menor = min(amperagem)
        -amperagem
    }]
-----
    Objeto final
    [{
        id
        tempoInicial
        tempoFinal  
        tempoDeArc
        arrayLength
        tipo
        media
        maior
        menor
        amperagem
    }]

## someForAllDevicesMinutesWorkOrStopping
    (CORDÕES DE UM PROMETEUS)
    {{
        "data":{
            data
            quantidadeDeCordoesDeSolda
            tempoTrabalhado
        }
    }}
-----
    {
        +tempoTrabalhado = tempoDeArc + tempoDeArc
        +quantidadeDeCordoesDeSolda = contagem(cordões)
    }
-----
    [{
        +tempoParado = tempoDisponívelDeTrabalho - tempoTrabalhado
        +porcentagemTrabalhando = tempoTrabalhado * 100 / tempoDisponívelDeTrabalho
        +porcentagemParado = tempoParado * 100 /  tempoDisponívelDeTrabalho
        +porcentagemCapacidadeEfetiva = tempoTrabalhado * 100 / tempoEfetivoDeTrabalho
    }]
-----
    Objeto Final
    prometeus <>
    [{
        data <>
        quantidadeDeCordoesDeSolda <>
        tempoTrabalhado <>
        quantidadeDeCordoesDeSolda <>
        tempoParado <>
        porcentagemTrabalhando <>
        porcentagemParado <>
        porcentagemCapacidadeEfetiva <>
    }]
-----


