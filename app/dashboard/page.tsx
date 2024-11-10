/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { AIWebsiteGenerator } from "@/components/AIWebsiteGenerator";
import DeploymentVisual from "@/components/DeploymentVisual";
import { ExampleWebsites } from "@/components/ExampleWebsites";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sidebar } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import {
  createWebpageWithName,
  getUserIdByEmail,
  getUserWebpages,
  getWebpageContent,
  initializeClients,
  updateWebpageContent,
} from "@/utils/db/actions";
import { usePrivy } from "@privy-io/react-auth";
import {
  Activity,
  Clock,
  Cpu,
  GitBranch,
  Globe,
  Layout,
  Loader2,
  Rocket,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";

type Webpage = {
  webpages: {
    id: number;
    domain: string;
    cid: string;
    name: string | null;
  };
  deployments: {
    id: number;
    deploymentUrl: string;
    deployedAt: Date | null;
    transactionHash: string;
  } | null;
};

export default function Dashboard() {
  const sidebarItems = [
    { name: "Sites", icon: Layout },
    { name: "Deploy", icon: Rocket },
    { name: "Manage Websites", icon: GitBranch },
    { name: "AI Website", icon: Cpu },
    { name: "Search Engine", icon: Search },
    { name: "Example Websites", icon: Globe },
  ];

  const [activeTab, setActiveTab] = useState("Sites");
  const [selectedWebpage, setSelectedWebpage] = useState<Webpage | null>(null);
  const [domain, setDomain] = useState("");
  const [content, setContent] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentError, setDeploymentError] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [w3name, setW3name] = useState<string | null>(null);
  const [deployedUrl, setDeployedUrl] = useState("");
  const [userWebpages, setUserWebpages] = useState<Webpage[]>([]);
  const [code, setCode] = useState(``);
  const [livePreview, setLivePreview] = useState(code);

  const { user, authenticated } = usePrivy();

  const handleUrlClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const truncateUrl = (url: string, maxLength: number = 30) => {
    if (!url) return "";
    if (url.length <= maxLength) return url;
    const start = url.substring(0, maxLength / 2 - 2);
    const end = url.substring(url.length - maxLength / 2 + 2);
    return `${start}...${end}`;
  };

  const handleEdit = async (webpage: Webpage) => {
    setSelectedWebpage(webpage);
    setDomain(webpage.webpages.domain);
    const webpageContent = await getWebpageContent(webpage.webpages.id);
    setContent(webpageContent);
    setW3name(webpage.webpages.name);
    setActiveTab("Deploy");
  };

  const [aiDeploymentStatus, setAiDeploymentStatus] = useState({
    isDeploying: false,
    deployedUrl: "",
    ipfsUrl: "",
    error: "",
  });

  useEffect(() => {
    async function init() {
      try {
        if (authenticated && user?.email?.address) {
          await initializeClients(user.email.address);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Failed to initialize clients:", error);
        setDeploymentError("");
      }
    }

    init();
  }, [authenticated, user]);

  useEffect(() => {
    async function fetchUserId() {
      if (authenticated && user?.email?.address) {
        const fetchedUserId = await getUserIdByEmail(user?.email?.address);
        console.log(fetchUserId);
        console.log(user.email.address);
        setUserId(fetchedUserId);
      }
    }

    fetchUserId();
  }, [authenticated, user]);

  useEffect(() => {
    async function fetchUserWebpages() {
      if (userId) {
        const webpages = await getUserWebpages(userId);
        console.log("=======web pages", webpages);
        setUserWebpages(webpages as Webpage[]);
      }
    }
    fetchUserWebpages();
  }, [userId]);

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeploymentError("");

    try {
      // 1. Check if we have web3storage client initialised
      if (!isInitialized) {
        throw new Error("Clients not initialized");
      }

      // 2. check if user id exist
      if (userId === null) {
        throw new Error("User not authenticated or ID not found");
      }

      // 3. createWebpageWithName
      const { webpage, txHash, cid, deploymentUrl, name, w3nameUrl } =
        await createWebpageWithName(userId, domain, content);

      // 4. update deployed url
      setDeployedUrl(w3nameUrl || deploymentUrl);

      // 5. setWeb3Name
      setW3name(name);
      console.log(
        `Deployed successfully. Transaction hash: ${txHash}, CID: ${cid}, URL: ${
          w3nameUrl || deploymentUrl
        }, W3name: ${name}`
      );

      // 6. update users webpages or refresh users webpages
      const updatedWebpages = await getUserWebpages(userId);
      setUserWebpages(updatedWebpages as Webpage[]);
    } catch (error) {
      console.error("Deployment failed:", error);
      setDeploymentError("Deployment failed. Please try again.");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleUpdate = async () => {
    setIsDeploying(true);
    setDeploymentError("");
    try {
      if (!isInitialized || userId === null || !selectedWebpage) {
        throw new Error(
          "Cannot update: missing initialization, user ID, or selected webpage"
        );
      }

      const { txHash, cid, deploymentUrl, w3nameUrl } =
        await updateWebpageContent(
          userId,
          selectedWebpage.webpages.id,
          content
        );

      setDeployedUrl(w3nameUrl || deploymentUrl);
      console.log(
        `Updated successfully. Transaction hash: ${txHash}, CID: ${cid}, URL: ${
          w3nameUrl || deploymentUrl
        }`
      );
      setLivePreview(content);

      // Update the selected webpage in the state
      setSelectedWebpage((prev) => {
        if (!prev) return null;
        return {
          webpages: {
            ...prev.webpages,
            cid,
          },
          deployments: {
            id: prev.deployments?.id ?? 0,
            deploymentUrl,
            transactionHash: txHash,
            deployedAt: new Date(),
          },
        };
      });

      // Refresh the user's webpages
      const updatedWebpages = await getUserWebpages(userId);
      setUserWebpages(updatedWebpages as Webpage[]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Update failed:", error);
      setDeploymentError(`Update failed: ${error.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleAIWebsiteDeploy = async (domain: string, content: string) => {
    setAiDeploymentStatus({
      isDeploying: true,
      deployedUrl: "",
      ipfsUrl: "",
      error: "",
    });
    setDeploymentError("");
    console.log(userId);

    try {
      if (!isInitialized || userId === null) {
        throw new Error("Cannot deploy: missing initialization or user ID");
      }

      const { webpage, txHash, cid, deploymentUrl, name, w3nameUrl } =
        await createWebpageWithName(userId, domain, content);

      const ipfsUrl = `https://dweb.link/ipfs/${cid}`;
      const finalDeployedUrl = w3nameUrl || deploymentUrl;

      setAiDeploymentStatus({
        isDeploying: false,
        deployedUrl: finalDeployedUrl,
        ipfsUrl: ipfsUrl,
        error: "",
      });

      setDeployedUrl(finalDeployedUrl);
      setW3name(name);
      console.log(
        `Deployed AI-generated website successfully. Transaction hash: ${txHash}, CID: ${cid}, URL: ${finalDeployedUrl}, W3name: ${name}`
      );

      // Refresh the user's webpages
      const updatedWebpages = await getUserWebpages(userId);
      setUserWebpages(updatedWebpages as Webpage[]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("AI website deployment failed:", error);
      setAiDeploymentStatus({
        isDeploying: false,
        deployedUrl: "",
        ipfsUrl: "",
        error: `AI website deployment failed: ${error.message}`,
      });
      setDeploymentError(`AI website deployment failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-300">
      <div className="flex">
        <Sidebar
          items={sidebarItems}
          activeItem={activeTab}
          setActiveItem={setActiveTab}
        />
        <div className="flex-1 p-10 ml-64">
          <h1 className="text-4xl font-bold mb-8 text-white">
            Welcome to Your Dashboard
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="bg-[#0a0a0a] border-[#18181b]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Total Websites
                </CardTitle>
                <Globe className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {userWebpages.length}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#0a0a0a] border-[#18181b]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Latest Deployment
                </CardTitle>
                <Clock className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {userWebpages.length > 0
                    ? new Date(
                        Math.max(
                          ...userWebpages
                            .filter((w) => w.deployments?.deployedAt)
                            .map((w) => w.deployments!.deployedAt!.getTime())
                        )
                      ).toLocaleDateString()
                    : "N/A"}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#0a0a0a] border-[#18181b]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Total Deployments
                </CardTitle>
                <Activity className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {userWebpages.filter((w) => w.deployments).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {activeTab === "Sites" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userWebpages.map((webpage) => (
                  <Card
                    key={webpage.webpages.id}
                    className="bg-[#0a0a0a] border-[#18181b]"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-white">
                        <span className="flex items-center">
                          <Globe className="mr-2 h-4 w-4" />
                          {webpage.webpages.domain}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p
                        className="mb-2 text-sm text-blue-400 cursor-pointer hover:underline overflow-hidden text-ellipsis"
                        onClick={() =>
                          handleUrlClick(
                            webpage.webpages.name
                              ? `https://dweb.link/ipfs/${webpage.webpages.cid}`
                              : webpage.deployments?.deploymentUrl || ""
                          )
                        }
                        title={
                          webpage.webpages.name
                            ? `https://dweb.link/ipfs/${webpage.webpages.cid}`
                            : webpage.deployments?.deploymentUrl
                        }
                      >
                        {truncateUrl(
                          webpage.webpages.name
                            ? `https://dweb.link/ipfs/${webpage.webpages.cid}`
                            : webpage.deployments?.deploymentUrl || ""
                        )}
                      </p>
                      <p className="mb-2 text-sm text-gray-500">
                        Deployed:{" "}
                        {webpage.deployments?.deployedAt?.toLocaleString()}
                      </p>
                      <p className="mb-2 text-sm overflow-hidden text-ellipsis text-gray-500">
                        TX: {webpage.deployments?.transactionHash.slice(0, 10)}
                        ...
                      </p>
                      <Button
                        onClick={() => handleEdit(webpage)}
                        className="w-full bg-secondary hover:bg-gray-700 text-white"
                      >
                        Edit
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {activeTab === "Deploy" && (
            <>
              <Card className="bg-[#0a0a0a] border-[#18181b]">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">
                    {selectedWebpage ? "Edit Website" : "Deploy a New Website"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="domain" className="text-lg text-gray-400">
                        Domain
                      </Label>
                      <Input
                        id="domain"
                        placeholder="Enter your domain"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="mt-1 bg-[#0a0a0a] text-white border-gray-700"
                        disabled={!!selectedWebpage}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="content"
                        className="text-lg text-gray-400"
                      >
                        Content
                      </Label>
                      <Textarea
                        id="content"
                        placeholder="Enter your HTML content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="mt-1 min-h-[200px] font-mono text-sm bg-[#0a0a0a] text-white border-gray-700"
                      />
                    </div>
                    <Button
                      onClick={selectedWebpage ? handleUpdate : handleDeploy}
                      disabled={
                        isDeploying ||
                        !domain ||
                        !content ||
                        !isInitialized ||
                        userId === null
                      }
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      {selectedWebpage ? "Update Website" : "Deploy to IPVault"}
                      {isDeploying ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {selectedWebpage ? "Updating..." : "Deploying..."}
                        </>
                      ) : selectedWebpage ? (
                        "Update Website"
                      ) : (
                        "Deploy to IPVault"
                      )}
                    </Button>
                    {deploymentError && (
                      <p className="text-red-400 mt-2">{deploymentError}</p>
                    )}
                    {deployedUrl && (
                      <DeploymentVisual deployedUrl={deployedUrl} />
                    )}
                  </div>
                </CardContent>
              </Card>

              {content && (
                <Card className="mt-4 bg-[#0a0a0a] border-[#18181b]">
                  <CardHeader>
                    <CardTitle className="text-white">Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border border-[#18181b] p-4 rounded-lg">
                      <iframe
                        srcDoc={content}
                        style={{
                          width: "100%",
                          height: "400px",
                          border: "none",
                        }}
                        title="Website Preview"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {activeTab === "Manage Websites" && (
            <div>
              <h2 className="text-2xl font-bold mb-2 text-white">
                Manage Your Websites
              </h2>
              <p className="mt-2 mb-6 text-gray-400">
                Note: This section allows manual management of your websites.
                Automated CI/CD features are coming soon!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userWebpages.map((webpage) => (
                  <Card
                    key={webpage.webpages.id}
                    className="bg-[#0a0a0a] border-[#18181b]"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-white">
                        <span className="flex items-center">
                          <Globe className="mr-2 h-4 w-4" />
                          {webpage.webpages.domain}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p
                        className="mb-2 text-sm text-blue-400 cursor-pointer hover:underline overflow-hidden text-ellipsis"
                        onClick={() =>
                          handleUrlClick(
                            webpage.webpages.name
                              ? `https://dweb.link/ipfs/${webpage.webpages.cid}`
                              : webpage.deployments?.deploymentUrl || ""
                          )
                        }
                        title={
                          webpage.webpages.name
                            ? `https://dweb.link/ipfs/${webpage.webpages.cid}`
                            : webpage.deployments?.deploymentUrl
                        }
                      >
                        {truncateUrl(
                          webpage.webpages.name
                            ? `https://dweb.link/ipfs/${webpage.webpages.cid}`
                            : webpage.deployments?.deploymentUrl || ""
                        )}
                      </p>
                      <p className="mb-2 text-sm text-gray-500">
                        Deployed:{" "}
                        {webpage.deployments?.deployedAt?.toLocaleString()}
                      </p>
                      <p className="mb-2 text-sm overflow-hidden text-ellipsis text-gray-500">
                        TX: {webpage.deployments?.transactionHash.slice(0, 10)}
                        ...
                      </p>
                      <Button
                        onClick={() => handleEdit(webpage)}
                        className="w-full bg-gray-800 hover:bg-gray-700 text-white"
                      >
                        Edit
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "AI Website" && (
            <Card className="bg-[#0a0a0a] border-[#18181b]">
              <CardHeader>
                <CardTitle className="text-2xl text-white">
                  AI Website Generator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIWebsiteGenerator
                  onDeploy={handleAIWebsiteDeploy}
                  isDeploying={aiDeploymentStatus.isDeploying}
                />
                {aiDeploymentStatus.isDeploying && (
                  <p className="mt-4 text-blue-400">
                    Deploying AI-generated website...
                  </p>
                )}
                {aiDeploymentStatus.error && (
                  <p className="mt-4 text-red-400">
                    {aiDeploymentStatus.error}
                  </p>
                )}
                {aiDeploymentStatus.deployedUrl && (
                  <div className="mt-4">
                    <p className="text-green-400">
                      AI-generated website deployed successfully!
                    </p>
                    <p className="text-white">
                      Deployed URL:{" "}
                      <a
                        href={aiDeploymentStatus.deployedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {aiDeploymentStatus.deployedUrl}
                      </a>
                    </p>
                    <p className="text-white">
                      IPFS URL:{" "}
                      <a
                        href={aiDeploymentStatus.ipfsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {aiDeploymentStatus.ipfsUrl}
                      </a>
                    </p>
                    <DeploymentVisual
                      deployedUrl={aiDeploymentStatus.deployedUrl}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "Example Websites" && <ExampleWebsites />}
        </div>
      </div>
    </div>
  );
}
