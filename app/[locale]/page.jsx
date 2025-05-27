import GenerateSection from "@/components/views/index/generate-section";
import ApiKeyButtons from "@/components/api-key-buttons";

const Home = async ({ params }) => {
  return (
    <>
      <main className="mx-auto relative z-10 p-4">
        <div className="flex justify-end mb-4">
          <ApiKeyButtons />
        </div>
        <GenerateSection />
      </main>
    </>
  );
};

export default Home;
