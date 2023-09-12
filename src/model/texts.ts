export type Scene =
    HelloGetInn | StartGetInn

export type HelloGetInn = {
    tpe: "HelloGetInn"
}

export type StartGetInn = {
    tpe: "StartGetInn"
}


export function getTexts (scene: Scene):string {
    switch (scene.tpe) {
        case "HelloGetInn":
            return "Привет. Я помогу тебе заполнить инн в выгрузке из АгРегистра. Для этого отправь мне файл с обязательными столбцами"
        case "StartGetInn":
            return "sf"
    }
}