/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

const shim = require('fabric-shim');
const util = require('util');

var Chaincode = class {

  // Initialize the chaincode
  async Init(stub) {
    console.info('========= example02 Init =========');
    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    let args = ret.params;
    // initialise only if 4 parameters passed.
    if (args.length != 4) {
      return shim.error('Incorrect number of arguments. Expecting 4');
    }

    let A = args[0];
    let B = args[2];
    let Aval = args[1];
    let Bval = args[3];

    if (typeof parseInt(Aval) !== 'number' || typeof parseInt(Bval) !== 'number') {
      return shim.error('Expecting integer value for asset holding');
    }

    try {
      await stub.putState(A, Buffer.from(Aval));
      try {
        await stub.putState(B, Buffer.from(Bval));
        return shim.success();
      } catch (err) {
        return shim.error(err);
      }
    } catch (err) {
      return shim.error(err);
    }
  }

  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    let method = this[ret.fcn];
    if (!method) {
      console.log('no method of name:' + ret.fcn + ' found');
      return shim.success();
    }
    try {
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  async invoke(stub, args) {
    if (args.length != 3) {
      throw new Error('Incorrect number of arguments. Expecting 3');
    }

    let A = args[0];
    let B = args[1];
    if (!A || !B) {
      throw new Error('asset holding must not be empty');
    }

    // Get the state from the ledger
    let Avalbytes = await stub.getState(A);
    if (!Avalbytes) {
      throw new Error('Failed to get state of asset holder A');
    }
    let Aval = parseInt(Avalbytes.toString());

    let Bvalbytes = await stub.getState(B);
    if (!Bvalbytes) {
      throw new Error('Failed to get state of asset holder B');
    }

    let Bval = parseInt(Bvalbytes.toString());
    // Perform the execution
    let amount = parseInt(args[2]);
    if (typeof amount !== 'number') {
      throw new Error('Expecting integer value for amount to be transaferred');
    }

    Aval = Aval - amount;
    Bval = Bval + amount;
    console.info(util.format('Aval = %d, Bval = %d\n', Aval, Bval));

    // Write the states back to the ledger
    await stub.putState(A, Buffer.from(Aval.toString()));
    await stub.putState(B, Buffer.from(Bval.toString()));

  }

  // Deletes an entity from state
  async delete(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }

    let A = args[0];

    // Delete the key from the state in ledger
    await stub.deleteState(A);
  }

  // query callback representing the query of a chaincode
  async query(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting name of the person to query')
    }

    let jsonResp = {};
    let A = args[0];

    // Get the state from the ledger
    let Avalbytes = await stub.getState(A);
    if (!Avalbytes) {
      jsonResp.error = 'Failed to get state for ' + A;
      throw new Error(JSON.stringify(jsonResp));
    }

    jsonResp.name = A;
    jsonResp.amount = Avalbytes.toString();
    console.info('Query Response:');
    console.info(jsonResp);
    return Avalbytes;
  }

  //Homework 04102018
  async addClient(stub, args) {
    if (args.length != 2) {
      throw new Error('Incorrect number of arguments. Expecting 2');
    }

    //get client id and client amount
    let A = args[0];
    let amount = args[1];
    if (typeof parseInt(amount) !== 'number') {
      throw new Error('Expecting integer value for amount to be transaferred');
    }

    // Write the states back to the ledger
    // try {
      await stub.putState(A, Buffer.from(amount));
    //   return shim.success();
    // } catch (err) {
    //   return shim.error(err);
    // }
  }

  async updateClient(stub, args) {
    if (args.length != 2) {
      throw new Error('Incorrect number of arguments. Expecting 2');
    }

    let A = args[0];
    let Avalbytes = await stub.getState(A);
    if (!Avalbytes) {
      throw new Error('Not found exsiting Client');
    }

    let amount = parseInt(args[1]);
    if (typeof amount !== 'number') {
      throw new Error('Expecting integer value for amount to be transaferred');
    }

    // Write the states back to the ledger
    try {
      await stub.putState(A, Buffer.from(amount.toString()));
      return shim.success();
    } catch (err) {
      return shim.error(err);
    }
  }

  async deleteClient(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }

    let A = args[0];
    let Avalbytes = await stub.getState(A);
    if (!Avalbytes) {
      throw new Error('Not found exsiting Client');
    }

    // Write the states back to the ledger
    try {
      await stub.deleteState(A);
      return shim.success();
    } catch (err) {
      return shim.error(err);
    }
  }

  async queryAllClient(stub, args) {
    if (args.length != 0) {
      throw new Error('Incorrect number of arguments. Expecting 0');
    }

    // let A = args[0];
    // let Avalbytes = await stub.getState(A);
    // if (!Avalbytes) {
    //   throw new Error('Not found exsiting Client');
    // }

    // Write the states back to the ledger
    // try {
    //   await stub.deleteState(A);
    //   return shim.success();
    // } catch (err) {
    //   return shim.error(err);
    // }


    // let startKey = 'CAR0';
    // let endKey = 'CAR999';

    let iterator = await stub.getStateByPartialCompositeKey('Client', []);

    let allResults = [];
    while (true) {
      let res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        let jsonRes = {};
        console.log(res.value.value.toString('utf8'));

        jsonRes.Key = res.value.key;
        try {
          jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
        } catch (err) {
          console.log(err);
          jsonRes.Record = res.value.value.toString('utf8');
        }
        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await iterator.close();
        console.info(allResults);
        return Buffer.from(JSON.stringify(allResults));
      }
    }
  }

  async queryByClient(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting name of the person to query')
    }

    let jsonResp = {};
    let A = args[0];

    // Get the state from the ledger
    let Avalbytes = await stub.getState(A);
    if (!Avalbytes) {
      jsonResp.error = 'Failed to get state for ' + A;
      throw new Error(JSON.stringify(jsonResp));
    }

    jsonResp.name = A;
    jsonResp.amount = Avalbytes.toString();
    console.info('Query Response:');
    console.info(jsonResp);
    return Avalbytes;
  }

  async passMoney(stub, args) {
    if (args.length != 3) {
      throw new Error('Incorrect number of arguments. Expecting 3');
    }

    let A = args[0];
    let B = args[1];
    if (!A || !B) {
      // throw new Error('asset holding must not be empty');
      console.info('501 - asset holding must not be empty');
      return shim.success('501');
    }

    // Get the state from the ledger
    let Avalbytes = await stub.getState(A);
    if (!Avalbytes) {
      // throw new Error('Failed to get state of asset holder A');
      console.info('502 - Failed to get state of asset holder A');
      return shim.success('502');
    }
    let Aval = parseInt(Avalbytes.toString());

    let Bvalbytes = await stub.getState(B);
    if (!Bvalbytes) {
      // throw new Error('Failed to get state of asset holder B');
      console.info('503 - Failed to get state of asset holder B');
      return shim.success('503');
    }

    let Bval = parseInt(Bvalbytes.toString());
    // Perform the execution
    let amount = parseInt(args[2]);
    if (typeof amount !== 'number') {
      // throw new Error('Expecting integer value for amount to be transaferred');
      console.info('504 - Expecting integer value for amount to be transaferred');
      return shim.success('504');
    }

    if (Aval - amount < 0) {
      // not enough money
      console.info('505 - not enough money');
      return shim.success('505');
    }

    Aval = Aval - amount;
    Bval = Bval + amount;
    console.info(util.format('Aval = %d, Bval = %d\n', Aval, Bval));

    // Write the states back to the ledger
    await stub.putState(A, Buffer.from(Aval.toString()));
    await stub.putState(B, Buffer.from(Bval.toString()));
  }
  //Homework 04102018
};

shim.start(new Chaincode());
