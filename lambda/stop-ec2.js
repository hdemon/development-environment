const AWS = require("aws-sdk");
const util = require("util");
const ec2 = new AWS.EC2();

AWS.config.region = "ap-northeast-1";

const getInstanceIds = ({ StackName: stackName }) => {
  const params = {
    // NextToken: "STRING_VALUE",
    Filters: [
      {
        Name: "tag-key",
        Values: ["aws:cloudformation:stack-name"]
      },
      {
        Name: "tag-value",
        Values: ["development-environment"]
      },
      {
        Name: "instance-state-name",
        Values: ["running"]
      }
    ]
  };

  return new Promise(resolve => {
    ec2.describeInstances(params, (err, data) => {
      if (err) console.error(err, err.stack);
      const result = data.Reservations.reduce((acc, curr) => {
        return [...acc, ...curr.Instances.map(instance => instance.InstanceId)];
      }, []);
      resolve(result);
    });
  });
};

const ec2Stop = async InstanceIds => {
  const params = { InstanceIds };
  let hasSuccess = false;

  await ec2.terminateInstances(params, function(err, data) {
    console.log("Waiting for instance to be terminated..");
    if (!!err) {
      console.error(err, err.stack);
    } else {
      hasSuccess = true;
    }
  });

  return hasSuccess;
};

exports.handler = async (event, context) => {
  const instanceIds = await getInstanceIds({
    StackName: "development-environment"
  });
  console.log(`Instance: ${instanceIds.join("")}`);
  const hasSuccess = await ec2Stop(instanceIds);
  if (hasSuccess) {
    context.done(null, `Instance: ${instanceIds} have terminated`);
  }
};
