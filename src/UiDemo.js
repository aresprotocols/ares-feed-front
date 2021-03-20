import React, { useEffect, useState } from 'react';
import { Table, Grid, Card, Statistic } from 'semantic-ui-react';
import { notification, Spin, Form, Input, Modal, Select, Button, Row, Col, Divider, Tag } from "antd";
import "antd/dist/antd.css";

import { useSubstrate } from './substrate-lib';
import { TxButton } from './substrate-lib/components';
import config from './config';

const { Option } = Select;

function Main(props) {
  const { api, keyring } = useSubstrate();
  const { accountPair, setAccountAddress } = props;

  // The transaction submission status
  const [status, setStatus] = useState('');

  //balance
  const [accountBalance, setAccountBalance] = useState(0);

  //Alice accountPair
  const [accountPairAlice, setAccountAlice] = useState();

  //get name
  const [accountName, setAccountName] = useState();

  //get account
  const [accountSelected, setAccountSelected] = useState('');
  const keyringOptions = keyring.getPairs().map(account => ({
    key: account.address,
    value: account.address,
    label: account.meta.name.toUpperCase(),
  }));

  //modal input info
  const [regNode, setRegNode] = useState();
  const [regUrl, setRegUrl] = useState();
  const [priceName, setPriceName] = useState();

  //modal status
  const [isRegVisible, setRegVisible] = useState(false);
  const [isPriceVisible, setPriceVisible] = useState(false);
  const [loadingStatus, setLoading] = useState(false);

  const initialAddress =
    keyringOptions.length > 0 ? keyringOptions[0].value : '';

  // Set the initial address
  useEffect(() => {
    setAccountAddress(initialAddress);
    setAccountSelected(initialAddress);
  }, [setAccountAddress, initialAddress]);


  useEffect(() => {
    let unsubscribe;

    // If the user has selected an address, create a new subscription
    if (accountSelected) {
      api.query.system.account(accountSelected, balance => {
        setAccountBalance(balance.data.free.toHuman());
      })
        .then(unsub => {
          unsubscribe = unsub;
        })
        .catch(console.error);

      let uName;
      keyringOptions.map(item => {
        if (accountSelected == item.key) {
          uName = item.label
        }
      })
      setAccountName(uName);

      //TODO get alice address better way
      if (accountSelected == "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY") {
        setAccountAlice(accountPair)
      }
    }

    return () => unsubscribe && unsubscribe();
  }, [api, accountSelected]);

  const keyRow = keyringOptions.map((item, idx) => {
    return <Option value={item.value} label={item.label} key={idx}>
      <Row>
        <Col span={12} >{item.label}</Col>
        {accountBalance && accountSelected == item.key ?
          <Col span={12} style={{ textAlign: "right", color: "#a0aec0" }}><div></div>{accountBalance} DOT</Col>
          : null}
      </Row>
    </Option>
  })

  const layout = {
    labelCol: {
      span: 6,
    },
    wrapperCol: {
      span: 18,
    },
  };

  const onChange = address => {
    // Update state with new account address
    setAccountAddress(address);
    setAccountSelected(address);
    let uName;
    keyringOptions.map(item => {
      if (accountSelected == item.key) {
        uName = item.label
      }
    })
    setAccountName(uName);
  };

  const tips = (opt) => {
    notification[opt.type]({
      message: opt.title || "tips",
      description: opt.desc || "",
    });
  }

  const showRegModal = () => {
    if (accountBalance <= 0) {
      return tips({
        type: "error",
        title: "Ga fee required",
        desc: "Account balance too low, please click the faucet button."
      })
    }
    setRegVisible(true);
  };

  const hideRegModal = () => {
    setRegVisible(false);
  };

  const showPriceModal = () => {
    if (accountBalance <= 0) {
      return tips({
        type: "error",
        title: "Ga fee required",
        desc: "Account balance too low, please click the faucet button."
      })
    }
    setPriceVisible(true);
  };

  const hidePriceModal = () => {
    setPriceVisible(false);
  };

  const regStatusFn = (info) => {
    if (info.includes("Finalized") || info.includes("Failed")) {
      setLoading(false);
      hideRegModal();
      hidePriceModal();
      //TODO,  fetch and update

      // api.query.aresModule.aggregators(accountSelected, newValue => {
      //   console.log("-=-=-=-=-=-=-=-=-=-")
      // }).then(unsub => {
      //   // unsubscribe = unsub;
      // })
      //   .catch(console.error);
    } else {
      setLoading(true);
    }
  }

  return (
    <Grid.Column>

      <Row>
        <Col span={14}><h1>UiDemo</h1></Col>
        <Col span={10}>
          <Select
            showSearch
            style={{ width: "100%" }}
            value={accountSelected}
            onChange={onChange}
          >
            {keyRow}
          </Select>
        </Col>
      </Row>

      <Card style={{ width: "100%" }}>
        <Card.Content>
          <TxButton
            accountPair={accountPairAlice}
            label='获取水龙头代币'
            type='SIGNED-TX'
            setStatus={setStatus}
            attrs={{
              palletRpc: 'balances',
              callable: 'transfer',
              inputParams: [accountSelected, 1000000000000],
              paramFields: [true, true]
            }}
          />

          <Button type="primary" onClick={showRegModal} style={{ marginRight: 3 }}>注册为聚合者</Button>
          <Button type="primary" onClick={showPriceModal} style={{ marginRight: 3 }}>开始报价</Button>
          {/* <TxButton
            accountPair={accountPairAlice}
            label='获取聚合者列表'
            type='QUERY'
            setStatus={setStatus}
            attrs={{
              palletRpc: 'aresModule',
              callable: 'aggregators',
              inputParams: [accountSelected],
              paramFields: [true]
            }}
          /> */}

        </Card.Content>
      </Card>


      <Modal
        title="注册为聚合者"
        visible={isRegVisible}
        onCancel={hideRegModal}
        footer={null}
      >
        <Spin spinning={loadingStatus}>
          <Form
            {...layout}
            name="basic"
          >
            <Form.Item
              label="钱包名"
              name="name"
            >
              <p>{accountName}</p>
            </Form.Item>

            <Form.Item
              label="报价节点"
              name="node"
              rules={[{ required: true, message: '请输入报价节点' }]}
            >
              <Input onChange={(e) => setRegNode(e.target.value)} />
            </Form.Item>

            <Form.Item
              label="数据源地址"
              name="url"
              rules={[{ required: true, message: '请输入数据源地址!' }]}
            >
              <Input onChange={(e) => setRegUrl(e.target.value)} />
            </Form.Item>

            <Row>
              <Col span={24} style={{ textAlign: "right" }}>
                <TxButton
                  accountPair={accountPair}
                  label='注册为聚合者'
                  type='SIGNED-TX'
                  setStatus={regStatusFn}
                  attrs={{
                    palletRpc: 'aresModule',
                    callable: 'registerAggregator',
                    inputParams: [regNode, accountName, regUrl],
                    paramFields: [true, true, true]
                  }}
                />
              </Col>
            </Row>

          </Form>
        </Spin>
      </Modal>

      <Modal
        title="开始报价"
        visible={isPriceVisible}
        onCancel={hidePriceModal}
        footer={null}
      >
        <Spin spinning={loadingStatus}>
          <Form
            {...layout}
            name="basic"
          >
            <Form.Item
              label="报价代币"
              name="name"
            >
              <Input onChange={(e) => setPriceName(e.target.value)} />
            </Form.Item>

            <Row>
              <Col span={24} style={{ textAlign: "right" }}>
                <TxButton
                  accountPair={accountPair}
                  label='开始报价'
                  type='SIGNED-TX'
                  setStatus={regStatusFn}
                  attrs={{
                    palletRpc: 'aresModule',
                    callable: 'initiateRequest',
                    inputParams: [config.AGGREGATOR_ADDRESS, priceName, "0"],
                    paramFields: [true, true, true]
                  }}
                />
              </Col>
            </Row>
          </Form>
        </Spin>
      </Modal>


      <div style={{ overflowWrap: 'break-word' }}>{status}</div>
    </Grid.Column>
  );
}

export default function AresModule(props) {
  const { api } = useSubstrate();
  return (api.query.aresModule && api.query.aresModule.aggregators && api.query.aresModule.requests
    ? <Main {...props} /> : null);
}
