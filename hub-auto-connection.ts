import { HubConnection } from '@aspnet/signalr';
import { observable, action } from 'mobx';

export class HubAutoConnection {
    @observable connected = true;
    private autoInvokeParameters = new Map<string, any[]>();
    
    constructor(private hubConnection: HubConnection) {
        hubConnection.onclose(() => {
            this.reconnect();
        });  
    }
    
    @action
    private setConnected() {
        this.connected = true;
        for (const [key, args ] of Array.from(this.autoInvokeParameters)) {
            this.hubConnection.invoke(key, ...args);
        }
    }

    @action
    private reconnect() {
        this.connected = false;
        setTimeout(async () => {
            try {
                await this.hubConnection.start();
                this.setConnected();
            }
            catch(error) {
                this.reconnect();
            }
        }, 5000);
    }

    invoke<T = any>(methodName: string, ...args: any[]) {
        return this.hubConnection.invoke<T>(methodName, ...args);
    }

    on(methodName: string, newMethod: (...args: any[]) => void) {
        this.hubConnection.on(methodName, newMethod);
    }

    autoInvoke<T = any>(methodName: string, ...args: any[]) {
        this.autoInvokeParameters.set(methodName, args);
        return this.hubConnection.invoke<T>(methodName, ...args);
    }
}