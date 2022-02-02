import React, { useEffect, useState } from 'react';
import './App.css';
import {
    ApiConnection,
    ConnectionState,
    getWeb3Provider,
} from './lib/Web3Provider';
import { log } from './lib/log';
import detectEthereumProvider from '@metamask/detect-provider';
import SignIn, { showSignIn } from './SignIn';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import AccountNameHeader from './AccountNameHeader';
import { getContacts } from './external-apis/BackendAPI';
import ContactList from './ContactList';
import AddContactForm from './AddContactForm';
import { lookupAddress } from './external-apis/InjectedWeb3API';
import { ethers } from 'ethers';

function App() {
    const [apiConnection, setApiConnection] = useState<ApiConnection>({
        connectionState: ConnectionState.CheckingProvider,
    });
    const [ensNames, setEnsNames] = useState<Map<string, string>>(
        new Map<string, string>(),
    );

    const [contacts, setContacts] = useState<string[] | undefined>();

    const changeApiConnection = (newApiConnection: Partial<ApiConnection>) => {
        if (newApiConnection.connectionState) {
            log(
                `Changing state from ${
                    ConnectionState[apiConnection.connectionState]
                } to ${ConnectionState[newApiConnection.connectionState]}`,
            );
        }

        if (newApiConnection.sessionToken) {
            log(
                `Retrieved new session token: ${newApiConnection.sessionToken}`,
            );
        }

        if (newApiConnection.account) {
            log(`Account: ${newApiConnection.account}`);
        }

        if (newApiConnection.provider) {
            log(`Provider set`);
        }

        setApiConnection({ ...apiConnection, ...newApiConnection });
    };

    const createWeb3Provider = async () => {
        const web3Provider = await getWeb3Provider(
            await detectEthereumProvider(),
        );

        if (web3Provider.provider) {
            changeApiConnection({
                provider: web3Provider.provider,
                connectionState: web3Provider.connectionState,
            });
        } else {
            changeApiConnection({
                connectionState: web3Provider.connectionState,
            });
        }
    };

    const requestContacts = async (connection: ApiConnection) => {
        const retrievedContacts = await await getContacts(
            apiConnection.account as string,
            apiConnection.sessionToken as string,
        );
        setContacts(retrievedContacts);

        (
            await Promise.all(
                retrievedContacts.map(async (contact) => ({
                    address: contact,
                    ens: await lookupAddress(
                        connection.provider as ethers.providers.JsonRpcProvider,
                        contact,
                    ),
                })),
            )
        )
            .filter((lookup) => lookup.ens !== null)
            .forEach((lookup) =>
                ensNames.set(lookup.address, lookup.ens as string),
            );

        setEnsNames(new Map(ensNames));
    };

    useEffect(() => {
        if (!apiConnection.provider) {
            createWeb3Provider();
        }
    }, [apiConnection.provider]);

    useEffect(() => {
        if (!contacts && apiConnection.sessionToken) {
            requestContacts(apiConnection);
        }
    }, [apiConnection.sessionToken]);

    return (
        <div className="container">
            <div className="row row-space">
                {apiConnection.connectionState ===
                    ConnectionState.NoProvider && (
                    <div className="col-md-12 text-center">
                        No Ethereum provider detected.
                    </div>
                )}

                {apiConnection.provider &&
                    showSignIn(apiConnection.connectionState) && (
                        <div className="col-md-12 text-center">
                            <SignIn
                                apiConnection={apiConnection}
                                changeApiConnection={changeApiConnection}
                                setEnsNames={setEnsNames}
                                ensNames={ensNames}
                            />
                        </div>
                    )}
                {apiConnection.account &&
                    apiConnection.connectionState ===
                        ConnectionState.SignedIn && (
                        <div className="col-md-4">
                            <div className="row">
                                <div className="col-12 text-center">
                                    <AccountNameHeader
                                        account={apiConnection.account}
                                        ensNames={ensNames}
                                    />
                                </div>
                            </div>
                            <div className="row row-space">
                                <div className="col-12 text-center">
                                    <AddContactForm
                                        apiConnection={apiConnection}
                                        requestContacts={requestContacts}
                                    />
                                </div>
                            </div>
                            {contacts && (
                                <div className="row">
                                    <div className="col-12 text-center">
                                        <ContactList
                                            ensNames={ensNames}
                                            contacts={contacts}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
            </div>
        </div>
    );
}

export default App;