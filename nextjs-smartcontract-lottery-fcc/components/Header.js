
import {ConnectButton} from "web3uikit";

export default function Header(){


    return (
        <div>
            <h1 className="py-4 px-4 font-bold text-3xl">Lottery</h1>
            <ConnectButton moralisAuth={false} />
        </div>
    );
};
